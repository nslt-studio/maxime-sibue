// ── Config ──────────────────────────────────────────────
const SNAP_MARGIN = 200;
const TRANSITION = 'opacity 200ms cubic-bezier(0.4, 0, 0.2, 1)';

// ── Module state ────────────────────────────────────────
let items = [];
let videos = [];
let posters = [];
let activeIndex = -1;
let isMuted = true;
let isPaused = false;
let pauseBtnDefaultText = '';
let rafId = null;
let scrollRafId = null;
let list = null;
let isScrollingTo = -1;

let isPlaying = false;

// ── Init ────────────────────────────────────────────────
export function initHome() {
  list = document.querySelector('.selected-list');
  items = list ? [...list.querySelectorAll('.selected-item')] : [];
  if (!list || !items.length) return;

  items.forEach((item, i) => {
    const video = item.querySelector('.selected-full video');
    if (!video) return;

    // Remove loop for auto-advance, ensure muted
    video.removeAttribute('loop');
    video.muted = true;
    videos[i] = video;

    // Poster fade on first frame
    const poster = item.querySelector('.selected-full-poster');
    posters[i] = poster;

    video.addEventListener('timeupdate', () => {
      if (poster && poster.style.opacity !== '0' && video.currentTime > 0) {
        poster.style.transition = TRANSITION;
        poster.style.opacity = '0';
        poster.style.pointerEvents = 'none';
      }
    });

    video.addEventListener('ended', () => {
      if (i !== activeIndex) return;
      scrollToItem((i + 1) % items.length);
    });

    // 'playing' fires only when video is ACTUALLY rendering (not just buffering)
    video.addEventListener('playing', () => {
      if (i === activeIndex) isPlaying = true;
    });

    // 'waiting' fires when video stalls (buffering)
    video.addEventListener('waiting', () => {
      if (i === activeIndex) isPlaying = false;
    });

    video.addEventListener('pause', () => {
      if (i === activeIndex) isPlaying = false;
    });

  });

  list.addEventListener('scroll', onScroll, { passive: true });
  list.addEventListener('wheel', onWheel, { passive: false });
  items.forEach((item, i) => item.addEventListener('click', () => clickItem(i)));
  initControls();
  startProgressLoop();
  setActive(0);
}

// ── Cleanup ─────────────────────────────────────────────
export function cleanupHome() {
  cancelAnimationFrame(rafId);
  cancelAnimationFrame(scrollRafId);
  // Cancel all video downloads (free bandwidth for next page)
  videos.forEach(v => {
    if (v) {
      v.pause();
      v.removeAttribute('src');
      v.load();
    }
  });
  videos = [];
  posters = [];
  list?.removeEventListener('scroll', onScroll);
  list?.removeEventListener('wheel', onWheel);
  items = [];
  list = null;
  activeIndex = -1;
  isScrollingTo = -1;
  isPaused = false;
  isMuted = true;
  isPlaying = false;
  rafId = null;
}

// ── Click item (just mark active + scroll) ──────────────
function clickItem(index) {
  if (!list || !items[index]) return;
  isScrollingTo = index;
  items.forEach((item, i) => item.classList.toggle('active', i === index));
  list.scrollTo({
    left: items[index].offsetLeft - list.offsetLeft,
    behavior: 'smooth',
  });

  let timer = null;
  const onEnd = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      list.removeEventListener('scroll', onEnd);
      isScrollingTo = -1;
      setActive(index);
    }, 100);
  };
  list.addEventListener('scroll', onEnd, { passive: true });
}

// ── Wheel → horizontal scroll ────────────────────────────
let wheelLocked = false;

function onWheel(e) {
  if (!list || Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
  e.preventDefault();
  if (wheelLocked) return;

  const direction = e.deltaY > 0 ? 1 : -1;
  const target = activeIndex + direction;
  if (target < 0 || target >= items.length) return;

  wheelLocked = true;
  clickItem(target);
  setTimeout(() => { wheelLocked = false; }, 600);
}

// ── Scroll detection (rAF-throttled) ────────────────────
function onScroll() {
  if (scrollRafId) return;
  scrollRafId = requestAnimationFrame(() => {
    detectSnappedItem();
    scrollRafId = null;
  });
}

function detectSnappedItem() {
  if (!list || !items.length || isScrollingTo >= 0) return;

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

  isScrollingTo = index;
  list.scrollTo({
    left: items[index].offsetLeft - list.offsetLeft,
    behavior: 'smooth',
  });

  let timer = null;
  const onEnd = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      list.removeEventListener('scroll', onEnd);
      isScrollingTo = -1;
    }, 100);
  };
  list.addEventListener('scroll', onEnd, { passive: true });

  isPaused = false;
  const pauseBtn = document.querySelector('[data-controls="pause"]');
  if (pauseBtn && pauseBtnDefaultText) pauseBtn.textContent = pauseBtnDefaultText;

  setActive(index);
}

// ── Set active item ─────────────────────────────────────
function setActive(index) {
  if (index === activeIndex) return;
  const prev = activeIndex;
  activeIndex = index;

  items.forEach((item, i) => item.classList.toggle('active', i === index));

  // Reset previous item: video to 0, progress to 0, poster visible
  if (prev >= 0) {
    const prevVideo = videos[prev];
    if (prevVideo) {
      prevVideo.pause();
      prevVideo.currentTime = 0;
    }
    const prevBar = items[prev]?.querySelector('.selected-progress');
    if (prevBar) prevBar.style.left = '0%';
    const prevCover = items[prev]?.querySelector('.selected-cover');
    if (prevCover) prevCover.style.setProperty('--progress', '0%');
  }

  isPlaying = false;
  updateProgressUI(0, 0);

  const video = videos[index];
  if (video) {
    video.muted = isMuted;
    if (!isPaused) {
      video.play().catch(() => {
        video.addEventListener('canplay', () => {
          if (activeIndex === index && !isPaused) video.play().catch(() => {});
        }, { once: true });
      });
    }
  }

  // Preload next video
  const nextVideo = videos[(index + 1) % items.length];
  if (nextVideo && nextVideo.readyState <= 1) nextVideo.load();
}

// ── rAF progress loop ────────────────────────────────────
function startProgressLoop() {
  function tick() {
    if (activeIndex >= 0 && isPlaying) {
      const video = videos[activeIndex];
      if (video && video.duration > 0) {
        updateProgressUI(video.currentTime / video.duration, video.currentTime);
      }
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

  const bar = item.querySelector('.selected-progress');
  if (bar) bar.style.left = pct;

  const cover = item.querySelector('.selected-cover');
  if (cover) cover.style.setProperty('--progress', pct);

  const durationEl = document.querySelector('#videoDuration');
  if (durationEl) durationEl.textContent = formatTime(currentTime);
}

// ── Controls ────────────────────────────────────────────
function initControls() {
  const pauseBtn = document.querySelector('[data-controls="pause"]');
  if (pauseBtn) {
    pauseBtnDefaultText = pauseBtn.textContent;
    pauseBtn.addEventListener('click', togglePause);
  }

  const muteBtn = document.querySelector('[data-controls="muted"]');
  if (muteBtn) muteBtn.addEventListener('click', toggleMute);
}

function togglePause() {
  const video = videos[activeIndex];
  const pauseBtn = document.querySelector('[data-controls="pause"]');
  if (!video || !pauseBtn) return;

  isPaused = !isPaused;
  if (isPaused) {
    video.pause();
    pauseBtn.textContent = 'Jouer';
  } else {
    video.play();
    pauseBtn.textContent = pauseBtnDefaultText;
  }
}

function toggleMute() {
  const muteBtn = document.querySelector('[data-controls="muted"]');
  if (!muteBtn) return;

  isMuted = !isMuted;
  muteBtn.classList.toggle('active', isMuted);

  const video = videos[activeIndex];
  if (video) video.muted = isMuted;
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
