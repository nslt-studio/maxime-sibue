import { formatTime } from '../utils.js';

// ── Config ──────────────────────────────────────────────
const FADE = 300;
const EASING = 'cubic-bezier(0.4, 0, 0.2, 1)';

// ── Module state ────────────────────────────────────────
let videos = [];
let activeIndex = -1;
let isMuted = true;
let isPaused = false;
let mediaStarted = false;
let pauseBtnDefaultText = '';
let rafId = null;
let isPlaying = false;
let observer = null;
let abortController = null;
let projectItems = [];
let indexItems = [];
let isScrollingToItem = false;

// ── Init ────────────────────────────────────────────────
export function initDetails() {
  abortController = new AbortController();
  const signal = abortController.signal;

  formatServices();

  videos = [...document.querySelectorAll('#swup video')];
  projectItems = [...document.querySelectorAll('[project-item]')];
  indexItems = [...document.querySelectorAll('.project-index-item[project-index]')];

  indexItems.forEach(indexItem => {
    indexItem.addEventListener('click', () => {
      const title = indexItem.getAttribute('project-index');
      const target = projectItems.find(p => p.getAttribute('project-item') === title);
      if (!target) return;

      isScrollingToItem = true;
      updateActiveIndex(title);
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });

      let timer = null;
      const scrollParent = target.closest('.project-item-wrapper') || window;
      const onEnd = () => {
        clearTimeout(timer);
        timer = setTimeout(() => {
          scrollParent.removeEventListener('scroll', onEnd);
          isScrollingToItem = false;
        }, 150);
      };
      scrollParent.addEventListener('scroll', onEnd, { passive: true });
    }, { signal });
  });

  initLoadingAnimations(signal);

  videos.forEach((video, i) => {
    video.muted = true;
    video.preload = 'metadata';

    video.style.opacity = '0';
    video.style.transition = `opacity ${FADE}ms ${EASING}`;
    const show = () => { video.style.opacity = '1'; };

    if (video.readyState >= 2) {
      show();
    } else {
      video.addEventListener('loadeddata', show, { once: true, signal });
      video.addEventListener('playing', show, { once: true, signal });
    }

    video.addEventListener('playing', () => {
      if (i !== activeIndex) return;
      isPlaying = true;
    }, { signal });

    video.addEventListener('waiting', () => {
      if (i === activeIndex) isPlaying = false;
    }, { signal });

    video.addEventListener('pause', () => {
      if (i === activeIndex) isPlaying = false;
    }, { signal });

    video.addEventListener('ended', () => {
      if (i === activeIndex) isPlaying = false;
    }, { signal });
  });

  observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const item = entry.target;
      const title = item.getAttribute('project-item');
      const video = item.querySelector('video');
      const videoIndex = video ? videos.indexOf(video) : -1;

      if (entry.isIntersecting) {
        if (!isScrollingToItem) {
          if (title) updateActiveIndex(title);
        }
        if (videoIndex !== -1) {
          if (videoIndex === activeIndex) {
            if (video && video.paused && !isPaused && mediaStarted) {
              video.play().catch(() => {});
            }
          } else {
            setActive(videoIndex);
          }
        }
      } else {
        if (video) video.pause();
        if (videoIndex === activeIndex) isPlaying = false;
      }
    });
  }, { threshold: 0.5 });

  projectItems.forEach(item => observer.observe(item));

  initControls(signal);
  initProgressBar(signal);
  startProgressLoop();
  initCloseButton();

  const bar = document.querySelector('.progress-bar');
  if (bar) {
    bar.style.transformOrigin = 'left';
    bar.style.transform = 'scaleX(0)';
  }

  const progress = document.querySelector('.project-progress');
  if (progress) {
    progress.classList.remove('is-visible');
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        progress.classList.add('is-visible');
      });
    });
  }
}

// ── Freeze (stop media before out-animation) ─────────────
export function freezeDetails() {
  const video = videos[activeIndex];
  if (video) video.pause();
  isPlaying = false;
}

// ── Start (begin media after in-animation) ───────────────
export function startDetails() {
  mediaStarted = true;
  const video = videos[activeIndex];
  if (video && !isPaused) {
    if (video.readyState === 0) video.load();
    video.play().catch(() => {
      video.addEventListener('canplay', () => {
        if (activeIndex >= 0 && !isPaused) video.play().catch(() => {});
      }, { once: true, signal: abortController?.signal });
    });
  }
}

// ── Cleanup ─────────────────────────────────────────────
export function cleanupDetails() {
  cancelAnimationFrame(rafId);
  if (observer) { observer.disconnect(); observer = null; }
  if (abortController) { abortController.abort(); abortController = null; }
  videos.forEach(v => {
    v.pause();
    v.querySelectorAll('source').forEach(s => s.removeAttribute('src'));
    v.load();
  });

  const progress = document.querySelector('.project-progress');
  if (progress) progress.classList.remove('is-visible');

  indexItems.forEach(item => {
    item.classList.remove('active');
    item.style.opacity = '';
    item.style.transform = '';
    item.style.transition = '';
  });
  indexItems = [];
  projectItems = [];
  videos = [];
  activeIndex = -1;
  isPaused = false;
  isMuted = true;
  isPlaying = false;
  mediaStarted = false;
  rafId = null;
}

// ── Update active index item ────────────────────────────
function updateActiveIndex(title) {
  indexItems.forEach(item => {
    item.classList.toggle('active', item.getAttribute('project-index') === title);
  });
}

// ── Set active video ────────────────────────────────────
function setActive(index) {
  if (index === activeIndex) return;
  const prev = activeIndex;
  activeIndex = index;

  if (prev >= 0 && videos[prev]) videos[prev].pause();

  isPlaying = false;
  updateProgressUI(0, 0);

  const video = videos[index];
  if (video) {
    video.muted = isMuted;
    // Only play if media has been started (deferred until after in-animation)
    if (mediaStarted && !isPaused) {
      if (video.readyState === 0) video.load();
      video.play().catch(() => {
        video.addEventListener('canplay', () => {
          if (activeIndex === index && !isPaused) video.play().catch(() => {});
        }, { once: true, signal: abortController?.signal });
      });
    }
  }

  // Preload next video (regardless of mediaStarted)
  const nextVideo = videos[index + 1];
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
  const bar = document.querySelector('.progress-bar');
  if (bar) bar.style.transform = `scaleX(${progress})`;

  const durationEl = document.querySelector('#videoDuration');
  if (durationEl) durationEl.textContent = formatTime(currentTime);
}

// ── Controls (pause / mute) ─────────────────────────────
function initControls(signal) {
  const pauseBtn = document.querySelector('[data-controls="pause"]');
  if (pauseBtn) {
    pauseBtnDefaultText = pauseBtn.textContent;
    pauseBtn.addEventListener('click', togglePause, { signal });
  }

  const muteBtn = document.querySelector('[data-controls="muted"]');
  if (muteBtn) muteBtn.addEventListener('click', toggleMute, { signal });
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

// ── Progress bar (click to seek) ────────────────────────
function initProgressBar(signal) {
  const progressContainer = document.querySelector('.project-progress');
  if (!progressContainer) return;

  progressContainer.addEventListener('click', (e) => {
    const rect = progressContainer.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));

    const video = videos[activeIndex];
    if (video && video.duration) {
      video.currentTime = ratio * video.duration;
      updateProgressUI(ratio, video.currentTime);
    }
  }, { signal });
}

// ── Loading animation (letter wave until video plays) ────
function initLoadingAnimations(signal) {
  projectItems.forEach(item => {
    const loadingEl = [...item.querySelectorAll('p')]
      .find(p => p.textContent.trim() === 'Chargement');
    if (!loadingEl) return;

    const chars = [...loadingEl.textContent];
    const n = chars.length;
    loadingEl.innerHTML = chars
      .map((char, i) => `<span class="loading-letter" style="--i:${i};--n:${n}">${char}</span>`)
      .join('');

    const video = item.querySelector('video');
    if (!video) return;

    video.addEventListener('playing', () => {
      loadingEl.style.transition = `opacity ${FADE}ms ${EASING}`;
      loadingEl.style.opacity = '0';
    }, { once: true, signal });
  });
}

// ── Close button ────────────────────────────────────────
function initCloseButton() {
  const closeBtn = document.querySelector('#close');
  if (!closeBtn) return;
  closeBtn.setAttribute('href', window.__detailsReturnUrl || '/');
}

// ── Format services ──────────────────────────────────────
function formatServices() {
  const el = document.querySelector('#services');
  if (!el) return;
  const parts = el.textContent.split(',').map(s => s.trim()).filter(Boolean);
  el.innerHTML = parts.map(p => `<span style="display:block">${p}</span>`).join('');
}
