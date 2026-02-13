const FADE = 200;
const EASING = 'cubic-bezier(0.4, 0, 0.2, 1)';

let observer = null;
let videoStates = new Map();
let activeCategories = new Set();
let categoryButtons = [];
let btnController = null;

export function initProjects() {
  const items = document.querySelectorAll('.projects-item');
  if (!items.length) return;

  // Abort any previous listeners on persistent nav buttons
  if (btnController) btnController.abort();
  btnController = new AbortController();

  categoryButtons = [...document.querySelectorAll('.categories-button[data-categories]')];
  categoryButtons.forEach(btn => {
    btn.classList.remove('active');
    btn.addEventListener('click', () => onCategoryClick(btn), { signal: btnController.signal });
  });
  activeCategories.clear();

  // Reset any stale inline styles on items
  document.querySelectorAll('.projects-item[data-filter]').forEach(item => {
    item.style.height = '';
    item.style.overflow = '';
    item.style.transition = '';
  });

  observer = new IntersectionObserver(onIntersect, { threshold: 0.25 });

  items.forEach(item => {
    const coverInner = item.querySelector('.projects-cover-inner');
    if (!coverInner) return;

    const video = coverInner.querySelector('video');
    const poster = coverInner.querySelector('.projects-cover-poster');
    if (!video) return;

    // Aspect-ratio from video metadata
    video.addEventListener('loadedmetadata', () => {
      if (video.videoWidth && video.videoHeight) {
        coverInner.style.aspectRatio = `${video.videoWidth} / ${video.videoHeight}`;
      }
    });

    // Poster fade on first frame
    let posterHidden = false;
    video.addEventListener('timeupdate', () => {
      if (!posterHidden && poster && video.currentTime > 0) {
        posterHidden = true;
        poster.style.transition = `opacity ${FADE}ms ${EASING}`;
        poster.style.opacity = '0';
        poster.style.pointerEvents = 'none';
      }
    });

    videoStates.set(video, true);
    observer.observe(item);
  });
}

function onIntersect(entries) {
  entries.forEach(entry => {
    const video = entry.target.querySelector('video');
    if (!video || !videoStates.has(video)) return;

    if (entry.isIntersecting) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  });
}

// ── Category filtering (multi-select) ───────────────────
function onCategoryClick(btn) {
  const category = btn.dataset.categories;

  if (activeCategories.has(category)) {
    activeCategories.delete(category);
    btn.classList.remove('active');
  } else {
    activeCategories.add(category);
    btn.classList.add('active');
  }

  applyFilter();
}

function applyFilter() {
  document.querySelectorAll('.projects-item[data-filter]').forEach(item => {
    const shouldShow = activeCategories.size === 0 || activeCategories.has(item.dataset.filter);
    if (shouldShow) {
      expandItem(item);
    } else {
      collapseItem(item);
    }
  });
}

function collapseItem(item) {
  if (item.style.height === '0px') return;
  const h = item.offsetHeight;
  item.style.height = h + 'px';
  item.style.overflow = 'hidden';
  item.offsetHeight; // force reflow
  item.style.transition = `height ${FADE}ms ${EASING}`;
  item.style.height = '0px';
}

function expandItem(item) {
  if (!item.style.height || item.style.height === '') return;
  item.style.transition = 'none';
  item.style.height = '';
  item.style.overflow = '';
  const h = item.offsetHeight;
  item.style.height = '0px';
  item.style.overflow = 'hidden';
  item.offsetHeight; // force reflow
  item.style.transition = `height ${FADE}ms ${EASING}`;
  item.style.height = h + 'px';
  item.addEventListener('transitionend', () => {
    item.style.height = '';
    item.style.overflow = '';
    item.style.transition = '';
  }, { once: true });
}

export function cleanupProjects() {
  if (observer) { observer.disconnect(); observer = null; }
  videoStates.forEach((_, video) => video.pause());
  videoStates.clear();

  // Remove all button listeners + reset state
  if (btnController) { btnController.abort(); btnController = null; }
  activeCategories.clear();
  categoryButtons.forEach(btn => btn.classList.remove('active'));
  categoryButtons = [];

  document.querySelectorAll('.projects-item[data-filter]').forEach(item => {
    item.style.height = '';
    item.style.overflow = '';
    item.style.transition = '';
  });
}
