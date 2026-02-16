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

// ── Init ────────────────────────────────────────────────
export function initDetails() {
  abortController = new AbortController();
  const signal = abortController.signal;

  formatServices();

  videos = [...document.querySelectorAll('#swup video')];

  // Hide #index if 0 or 1 video
  const indexEl = document.querySelector('#index');
  if (indexEl && videos.length <= 1) {
    indexEl.style.display = 'none';
  }

  // Setup each video
  videos.forEach((video, i) => {
    video.muted = true;
    video.preload = 'auto';

    // Start hidden, fade in when video has frames to show
    video.style.opacity = '0';
    video.style.transition = `opacity ${FADE}ms ${EASING}`;
    const show = () => { video.style.opacity = '1'; };

    if (video.readyState >= 2) {
      // Direct page load: already has data
      show();
    } else {
      // Swup navigation: force browser to start loading
      video.load();
      // Show as soon as video can actually display something
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

    // 'playing' fires only when video is ACTUALLY playing (after buffering)
    video.addEventListener('playing', () => {
      if (i === activeIndex) {
        isPlaying = true;
        lastTime = video.currentTime;
        lastRafTime = performance.now();
      }
    }, { signal });

    // 'waiting' fires when video stalls (buffering)
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

  // IntersectionObserver: play in viewport, pause out
  observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const video = entry.target;
      const index = videos.indexOf(video);
      if (index === -1) return;

      if (entry.isIntersecting) {
        setActive(index);
      } else {
        video.pause();
        if (index === activeIndex) isPlaying = false;
      }
    });
  }, { threshold: 0.5 });

  videos.forEach(video => observer.observe(video));

  // Controls (same pattern as home)
  initControls(signal);

  // Progress bar (click to seek)
  initProgressBar(signal);

  // rAF progress loop
  startProgressLoop();

  // Close button
  initCloseButton();

  // Init progress bar state
  const bar = document.querySelector('.progress-bar');
  if (bar) {
    bar.style.transformOrigin = 'left';
    bar.style.transform = 'scaleX(0)';
  }

  // Animate project-progress in via CSS class (double rAF for transition)
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
  // Cancel all video downloads (free bandwidth for next page)
  videos.forEach(v => {
    v.pause();
    v.removeAttribute('src');
    v.load();
  });

  // Remove progress animation class
  const progress = document.querySelector('.project-progress');
  if (progress) progress.classList.remove('is-visible');

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

// ── Set active video ────────────────────────────────────
function setActive(index) {
  if (index === activeIndex) return;
  const prev = activeIndex;
  activeIndex = index;

  // Pause previous
  if (prev >= 0 && videos[prev]) videos[prev].pause();

  // Reset progress state
  lastTime = 0;
  lastRafTime = performance.now();
  duration = 0;
  isPlaying = false;
  updateProgressUI(0, 0);
  updateIndex();

  // Play new — 'playing' event will set isPlaying = true
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

// ── Update index display (01 / 06) ─────────────────────
function updateIndex() {
  const el = document.querySelector('#index');
  if (!el || videos.length <= 1) return;
  const current = String(activeIndex + 1).padStart(2, '0');
  const total = String(videos.length).padStart(2, '0');
  el.textContent = `${current} / ${total}`;
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
