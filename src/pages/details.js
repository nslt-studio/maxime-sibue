// ── Config ──────────────────────────────────────────────
const FADE = 300;
const EASING = 'cubic-bezier(0.4, 0, 0.2, 1)';

// ── Module state ────────────────────────────────────────
let videos = [];
let activeIndex = -1;
let isMuted = true;
let isPaused = false;
let pauseBtnDefaultText = '';
let rafId = null;
let isPlaying = false;
let lastTime = 0;
let lastRafTime = 0;
let duration = 0;
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

  // Project items and index items (matched by title attribute)
  projectItems = [...document.querySelectorAll('[project-item]')];
  indexItems = [...document.querySelectorAll('.project-index-item[project-index]')];

  // Click on index item → scroll to matching project item
  indexItems.forEach(indexItem => {
    indexItem.addEventListener('click', () => {
      const title = indexItem.getAttribute('project-index');
      const target = projectItems.find(p => p.getAttribute('project-item') === title);
      if (!target) return;

      isScrollingToItem = true;
      updateActiveIndex(title);
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });

      // Unlock observer after scroll settles
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

  // Setup each video
  videos.forEach((video, i) => {
    video.muted = true;
    video.preload = 'auto';

    // Start hidden, fade in when video has frames to show
    video.style.opacity = '0';
    video.style.transition = `opacity ${FADE}ms ${EASING}`;
    const show = () => { video.style.opacity = '1'; };

    if (video.readyState >= 2) {
      show();
    } else {
      video.load();
      video.addEventListener('loadeddata', show, { once: true, signal });
      video.addEventListener('playing', show, { once: true, signal });
    }

    // Sync progress state on each timeupdate
    video.addEventListener('timeupdate', () => {
      if (i !== activeIndex) return;
      lastTime = video.currentTime;
      lastRafTime = performance.now();
      duration = video.duration || 0;
    }, { signal });

    video.addEventListener('playing', () => {
      if (i === activeIndex) {
        isPlaying = true;
        lastTime = video.currentTime;
        lastRafTime = performance.now();
      }
    }, { signal });

    video.addEventListener('waiting', () => {
      if (i === activeIndex) {
        isPlaying = false;
        lastTime = video.currentTime;
      }
    }, { signal });

    video.addEventListener('pause', () => {
      if (i === activeIndex) {
        isPlaying = false;
        lastTime = video.currentTime;
      }
    }, { signal });

    video.addEventListener('ended', () => {
      if (i === activeIndex) {
        isPlaying = false;
        lastTime = video.currentTime;
      }
    }, { signal });
  });

  // IntersectionObserver on .project-item: activate matching index item + play video
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
        if (videoIndex !== -1) setActive(videoIndex);
      } else {
        if (video) video.pause();
        if (videoIndex === activeIndex) isPlaying = false;
      }
    });
  }, { threshold: 0.5 });

  projectItems.forEach(item => observer.observe(item));

  // Controls
  initControls(signal);
  initProgressBar(signal);
  startProgressLoop();
  initCloseButton();

  // Init progress bar state
  const bar = document.querySelector('.progress-bar');
  if (bar) {
    bar.style.transformOrigin = 'left';
    bar.style.transform = 'scaleX(0)';
  }

  // Animate project-progress in
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

// ── Cleanup ─────────────────────────────────────────────
export function cleanupDetails() {
  cancelAnimationFrame(rafId);
  if (observer) { observer.disconnect(); observer = null; }
  if (abortController) { abortController.abort(); abortController = null; }
  videos.forEach(v => {
    v.pause();
    v.removeAttribute('src');
    v.load();
  });

  const progress = document.querySelector('.project-progress');
  if (progress) progress.classList.remove('is-visible');

  indexItems.forEach(item => item.classList.remove('active'));
  indexItems = [];
  projectItems = [];
  videos = [];
  activeIndex = -1;
  isPaused = false;
  isMuted = true;
  isPlaying = false;
  rafId = null;
  lastTime = 0;
  lastRafTime = 0;
  duration = 0;
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

  lastTime = 0;
  lastRafTime = performance.now();
  duration = 0;
  isPlaying = false;
  updateProgressUI(0, 0);

  const video = videos[index];
  if (video) {
    video.currentTime = 0;
    video.muted = isMuted;
    duration = video.duration || 0;
    if (!isPaused) {
      video.play().catch(() => {});
    }
  }
}

// ── rAF progress loop (smooth 60fps interpolation) ──────
function startProgressLoop() {
  function tick() {
    if (activeIndex >= 0 && isPlaying && duration > 0) {
      const elapsed = (performance.now() - lastRafTime) / 1000;
      const currentTime = Math.min(lastTime + elapsed, duration);
      updateProgressUI(currentTime / duration, currentTime);
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
      lastTime = video.currentTime;
      lastRafTime = performance.now();
      updateProgressUI(ratio, video.currentTime);
    }
  }, { signal });
}

// ── Close button (set href, let Swup handle navigation) ─
function initCloseButton() {
  const closeBtn = document.querySelector('#close');
  if (!closeBtn) return;

  closeBtn.setAttribute('href', window.__detailsReturnUrl || '/');
}

// ── Format services (wrap each in a block span for stagger animation) ─
function formatServices() {
  const el = document.querySelector('#services');
  if (!el) return;
  const parts = el.textContent.split(',').map(s => s.trim()).filter(Boolean);
  el.innerHTML = parts.map(p => `<span style="display:block">${p}</span>`).join('');
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
