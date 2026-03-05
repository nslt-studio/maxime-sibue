import { formatTime } from '../utils.js';

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
let mediaStarted = false;
let pauseBtnDefaultText = '';
let rafId = null;
let scrollRafId = null;
let list = null;
let isScrollingTo = -1;
let isPlaying = false;

// ── Lazy-load a video's source from data-src ─────────────
function loadVideoSrc(video) {
  const source = video.querySelector('source[data-src]');
  if (!source) return;
  source.src = source.dataset.src;
  source.removeAttribute('data-src');
  video.load();
}

// ── Init ────────────────────────────────────────────────
export function initHome() {
  list = document.querySelector('.selected-list');
  items = list ? [...list.querySelectorAll('.selected-item')] : [];
  if (!list || !items.length) return;

  items.forEach((item, i) => {
    const bar = item.querySelector('.selected-progress');
    if (bar) {
      bar.style.transition = 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1)';
      bar.style.transform = 'translateY(-50%) scaleY(0)';
    }

    const video = item.querySelector('.selected-full video');
    if (!video) return;

    video.removeAttribute('loop');
    video.muted = true;
    video.preload = 'metadata';
    videos[i] = video;

    const poster = item.querySelector('.selected-full-poster');
    posters[i] = poster;

    video.addEventListener('canplay', () => {
      if (poster && poster.style.opacity !== '0') {
        poster.style.transition = TRANSITION;
        poster.style.opacity = '0';
        poster.style.pointerEvents = 'none';
      }
    });

    video.addEventListener('ended', () => {
      if (i !== activeIndex) return;
      scrollToItem((i + 1) % items.length);
    });

    video.addEventListener('playing', () => {
      if (i === activeIndex) {
        isPlaying = true;
        const bar = items[i]?.querySelector('.selected-progress');
        if (bar) bar.style.transform = 'translateY(-50%) scaleY(1)';
      }
    });

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

// ── Freeze (stop media before out-animation) ─────────────
export function freezeHome() {
  const video = videos[activeIndex];
  if (video) video.pause();
  isPlaying = false;
}

// ── Start (begin media after in-animation) ───────────────
export function startHome() {
  mediaStarted = true;
  const video = videos[activeIndex];
  if (video && !isPaused) {
    loadVideoSrc(video);
    video.play().catch(() => {
      video.addEventListener('canplay', () => {
        if (activeIndex >= 0 && !isPaused) video.play().catch(() => {});
      }, { once: true });
    });
  }
}

// ── Cleanup ─────────────────────────────────────────────
export function cleanupHome() {
  cancelAnimationFrame(rafId);
  cancelAnimationFrame(scrollRafId);
  videos.forEach(v => {
    if (v) {
      v.pause();
      v.querySelectorAll('source').forEach(s => s.removeAttribute('src'));
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
  mediaStarted = false;
  rafId = null;
}

// ── Click item ───────────────────────────────────────────
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

  isPaused = false;
  const pauseBtn = document.querySelector('[data-controls="pause"]');
  if (pauseBtn && pauseBtnDefaultText) pauseBtn.textContent = pauseBtnDefaultText;

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

// ── Set active item ─────────────────────────────────────
function setActive(index) {
  if (index === activeIndex) return;
  const prev = activeIndex;
  activeIndex = index;

  items.forEach((item, i) => item.classList.toggle('active', i === index));

  if (prev >= 0) {
    const prevVideo = videos[prev];
    if (prevVideo) {
      prevVideo.pause();
      prevVideo.currentTime = 0;
    }
    const prevBar = items[prev]?.querySelector('.selected-progress');
    if (prevBar) { prevBar.style.left = '0%'; prevBar.style.transform = 'scaleY(0)'; }
    const prevTitles = items[prev]?.querySelector('.selected-titles');
    if (prevTitles) {
      prevTitles.style.webkitMaskImage = '';
      prevTitles.style.maskImage = '';
      prevTitles.style.opacity = '';
    }
  }

  isPlaying = false;
  updateProgressUI(0, 0);

  const bar = items[index]?.querySelector('.selected-progress');
  if (bar) bar.style.transform = 'translateY(-50%) scaleY(0)';

  const video = videos[index];
  if (video) {
    loadVideoSrc(video);
    video.preload = 'auto';
    if (video.readyState <= 1) video.load();
    video.muted = isMuted;
    // Only play if media has been started (deferred until after in-animation)
    if (mediaStarted && !isPaused) {
      video.play().catch(() => {
        video.addEventListener('canplay', () => {
          if (activeIndex === index && !isPaused) video.play().catch(() => {});
        }, { once: true });
      });
    }
  }

  // Preload next 2 videos — skip on slow connections (2G/slow-2G)
  const conn = navigator.connection;
  const isSlow = conn && (conn.effectiveType === '2g' || conn.effectiveType === 'slow-2g');
  if (!isSlow) {
    for (let offset = 1; offset <= 2; offset++) {
      const nextIdx = (index + offset) % items.length;
      if (nextIdx !== index) {
        const nextVideo = videos[nextIdx];
        if (nextVideo) loadVideoSrc(nextVideo);
      }
    }
  }
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
  if (bar) {
    bar.style.left = pct;
  }

  const titles = item.querySelector('.selected-titles');
  if (titles) {
    titles.style.opacity = 1;
    const gradient = `linear-gradient(to right, black ${pct}, rgba(0,0,0,0.4) ${pct})`;
    titles.style.webkitMaskImage = gradient;
    titles.style.maskImage = gradient;
  }

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
