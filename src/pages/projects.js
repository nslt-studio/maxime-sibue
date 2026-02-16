const FADE = 300;
const EASING = 'cubic-bezier(0.4, 0, 0.2, 1)';

let activeCategories = new Set();
let categoryButtons = [];
let btnController = null;

export function initProjects() {
  const items = document.querySelectorAll('.projects-item');
  if (!items.length) return;

  // Abort any previous listeners on persistent nav buttons
  if (btnController) btnController.abort();
  btnController = new AbortController();
  const signal = btnController.signal;

  categoryButtons = [...document.querySelectorAll('.categories-button[data-categories]')];
  categoryButtons.forEach(btn => {
    btn.classList.remove('active');
    btn.addEventListener('click', () => onCategoryClick(btn), { signal });
  });
  activeCategories.clear();

  // Reset any stale inline styles on items
  document.querySelectorAll('.projects-item[data-filter]').forEach(item => {
    item.style.height = '';
    item.style.overflow = '';
    item.style.transition = '';
  });

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
    }, { signal });

    // Poster fade on first frame
    let posterHidden = false;
    video.addEventListener('timeupdate', () => {
      if (!posterHidden && poster && video.currentTime > 0) {
        posterHidden = true;
        poster.style.transition = `opacity ${FADE}ms ${EASING}`;
        poster.style.opacity = '0';
        poster.style.pointerEvents = 'none';
      }
    }, { signal });

    // Prevent autoplay and any loading until hover
    video.removeAttribute('autoplay');
    video.preload = 'none';
    if (!video.paused) video.pause();

    // Load + play only on hover
    item.addEventListener('mouseenter', () => {
      if (video.readyState === 0) video.load();
      video.play().catch(() => {});
    }, { signal });

    item.addEventListener('mouseleave', () => {
      video.pause();
    }, { signal });
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
  // Cancel all project video downloads (free bandwidth for next page)
  document.querySelectorAll('.projects-cover-inner video').forEach(v => {
    v.pause();
    v.removeAttribute('src');
    v.load();
  });

  // Remove all listeners + reset state
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
