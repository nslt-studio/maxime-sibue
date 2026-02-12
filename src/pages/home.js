import Player from '@vimeo/player';

// ── Config ──────────────────────────────────────────────
const SNAP_MARGIN = 200; // px – margin for scroll-snap detection

// ── Module state ────────────────────────────────────────
let items = [];
let playerMap = new Map();   // index → Vimeo Player
let activeIndex = -1;
let isMuted = true;
let isPaused = false;
let pauseBtnDefaultText = '';
let rafId = null;
let scrollRafId = null;
let list = null;

// rAF interpolation state
let lastSeconds = 0;
let lastRafTime = 0;
let videoDuration = 0;
let isPlaying = false;

// ── Init ────────────────────────────────────────────────
export function initHome() {
  list = document.querySelector('.selected-list');
  items = list ? [...list.querySelectorAll('.selected-item')] : [];
  if (!list || !items.length) return;

  // Create Vimeo Player for each item
  items.forEach((item, i) => {
    const iframe = item.querySelector('.selected-full iframe');
    if (!iframe) return;

    // Mark iframe as managed (so global.js skips it)
    iframe.dataset.managed = 'true';

    const player = new Player(iframe);
    playerMap.set(i, player);

    // Disable loop so ended event fires
    player.setLoop(false);

    // Fade in iframe when player is ready
    player.ready().then(() => {
      iframe.style.opacity = '1';
    });

    // Progress tracking via timeupdate (updates ~4x/sec)
    player.on('timeupdate', (data) => {
      if (i !== activeIndex) return;
      lastSeconds = data.seconds;
      lastRafTime = performance.now();
      videoDuration = data.duration;
    });

    // Auto-advance when video ends
    player.on('ended', () => {
      if (i !== activeIndex) return;
      const nextIndex = (i + 1) % items.length;
      scrollToItem(nextIndex);
    });

    // Track playing state for rAF interpolation
    player.on('play', () => {
      if (i === activeIndex) {
        isPlaying = true;
        lastRafTime = performance.now();
      }
    });
    player.on('pause', () => {
      if (i === activeIndex) isPlaying = false;
    });
  });

  // Scroll detection (debounced)
  list.addEventListener('scroll', onScroll, { passive: true });

  // Click to scroll
  items.forEach((item, i) => {
    item.addEventListener('click', () => scrollToItem(i));
  });

  // Controls
  initControls();

  // Start rAF progress loop
  startProgressLoop();

  // Activate first item
  setActive(0);
}

// ── Cleanup ─────────────────────────────────────────────
export function cleanupHome() {
  cancelAnimationFrame(rafId);
  cancelAnimationFrame(scrollRafId);

  playerMap.forEach(player => {
    try { player.pause(); } catch {}
  });
  playerMap.clear();

  list?.removeEventListener('scroll', onScroll);
  items = [];
  list = null;
  activeIndex = -1;
  isPaused = false;
  isMuted = true;
  isPlaying = false;
  rafId = null;
}

// ── Scroll detection (rAF-throttled for instant feedback) ──
function onScroll() {
  if (scrollRafId) return;
  scrollRafId = requestAnimationFrame(() => {
    detectSnappedItem();
    scrollRafId = null;
  });
}

function detectSnappedItem() {
  if (!list || !items.length) return;
  const listLeft = list.getBoundingClientRect().left;

  let closestIndex = 0;
  let closestDist = Infinity;

  items.forEach((item, i) => {
    const dist = Math.abs(item.getBoundingClientRect().left - listLeft);
    if (dist < closestDist) {
      closestDist = dist;
      closestIndex = i;
    }
  });

  if (closestDist < SNAP_MARGIN && closestIndex !== activeIndex) {
    setActive(closestIndex);
  }
}

// ── Scroll to item ──────────────────────────────────────
function scrollToItem(index) {
  if (!list || !items[index]) return;

  const item = items[index];
  list.scrollTo({
    left: item.offsetLeft - list.offsetLeft,
    behavior: 'smooth',
  });

  // Reset pause on manual navigation
  isPaused = false;
  const pauseBtn = document.querySelector('[data-controls="pause"]');
  if (pauseBtn && pauseBtnDefaultText) {
    pauseBtn.textContent = pauseBtnDefaultText;
  }

  setActive(index);
}

// ── Set active item ─────────────────────────────────────
function setActive(index) {
  if (index === activeIndex) return;
  const prevIndex = activeIndex;
  activeIndex = index;

  // Toggle .active class
  items.forEach((item, i) => {
    item.classList.toggle('active', i === index);
  });

  // Pause previous video
  if (prevIndex >= 0 && playerMap.has(prevIndex)) {
    playerMap.get(prevIndex).pause();
  }

  // Reset progress for new item
  lastSeconds = 0;
  lastRafTime = performance.now();
  videoDuration = 0;
  isPlaying = false;
  updateProgressUI(0, 0);

  // Play new video
  const player = playerMap.get(index);
  if (player) {
    player.setCurrentTime(0);
    player.setMuted(isMuted);
    if (!isPaused) {
      player.play().then(() => {
        isPlaying = true;
        lastRafTime = performance.now();
      });
    }
    player.getDuration().then(d => { videoDuration = d; });
  }
}

// ── rAF progress loop (smooth 60fps interpolation) ──────
function startProgressLoop() {
  function tick() {
    if (activeIndex >= 0 && isPlaying && videoDuration > 0) {
      const now = performance.now();
      const elapsed = (now - lastRafTime) / 1000;
      const currentTime = Math.min(lastSeconds + elapsed, videoDuration);
      const progress = currentTime / videoDuration;

      updateProgressUI(progress, currentTime);
    }

    rafId = requestAnimationFrame(tick);
  }

  rafId = requestAnimationFrame(tick);
}

// ── Update progress UI ──────────────────────────────────
function updateProgressUI(progress, currentTime) {
  const item = items[activeIndex];
  if (!item) return;

  const pct = `${(progress * 100).toFixed(2)}%`;

  // Progress bar position
  const bar = item.querySelector('.selected-progress');
  if (bar) bar.style.left = pct;

  // Cover mask via custom property
  const cover = item.querySelector('.selected-cover');
  if (cover) cover.style.setProperty('--progress', pct);

  // Duration display
  const durationEl = document.querySelector('#videoDuration');
  if (durationEl) durationEl.textContent = formatTime(currentTime);
}

// ── Controls ────────────────────────────────────────────
function initControls() {
  // Pause / Play
  const pauseBtn = document.querySelector('[data-controls="pause"]');
  if (pauseBtn) {
    pauseBtnDefaultText = pauseBtn.textContent;
    pauseBtn.addEventListener('click', togglePause);
  }

  // Mute / Unmute
  const muteBtn = document.querySelector('[data-controls="muted"]');
  if (muteBtn) {
    muteBtn.addEventListener('click', toggleMute);
  }
}

function togglePause() {
  const player = playerMap.get(activeIndex);
  const pauseBtn = document.querySelector('[data-controls="pause"]');
  if (!player || !pauseBtn) return;

  isPaused = !isPaused;

  if (isPaused) {
    player.pause();
    pauseBtn.textContent = 'Jouer';
  } else {
    player.play();
    pauseBtn.textContent = pauseBtnDefaultText;
  }
}

function toggleMute() {
  const muteBtn = document.querySelector('[data-controls="muted"]');
  if (!muteBtn) return;

  isMuted = !isMuted;
  muteBtn.classList.toggle('active', isMuted);

  const player = playerMap.get(activeIndex);
  if (player) player.setMuted(isMuted);
}

// ── Format time as 00:00:000 ────────────────────────────
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return (
    String(mins).padStart(2, '0') + ':' +
    String(secs).padStart(2, '0') + ':' +
    String(ms).padStart(3, '0')
  );
}
