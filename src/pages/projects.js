const FADE = 300;
const EASING = 'cubic-bezier(0.4, 0, 0.2, 1)';

let activeCategory = null;
let categoryButtons = [];
let btnController = null;
let fadeObserver = null;
let navH = 0;

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
  activeCategory = null;

  // Reset any stale inline styles on items
  document.querySelectorAll('.projects-item[data-filter]').forEach(item => {
    item.style.height = '';
    item.style.overflow = '';
    item.style.transition = '';
  });

  items.forEach(item => {
    const video = item.querySelector('.projects-cover-inner video');
    const poster = item.querySelector('.projects-cover-inner .projects-cover-poster');
    if (!video) return;

    // Poster fade when video starts playing
    let posterHidden = false;
    video.addEventListener('playing', () => {
      if (!posterHidden && poster) {
        posterHidden = true;
        poster.style.transition = `opacity ${FADE}ms ${EASING}`;
        poster.style.opacity = '0';
        poster.style.pointerEvents = 'none';
      }
    }, { signal });
  });

  // Play/pause + fade nav selon viewport
  const nav = document.querySelector('.nav');
  navH = nav ? nav.getBoundingClientRect().height : 0;

  fadeObserver = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        const video = entry.target.querySelector('.projects-cover-inner video');

        if (entry.isIntersecting) {
          entry.target.style.transition = `opacity ${FADE}ms ${EASING}`;
          entry.target.style.opacity = '';
          entry.target.style.pointerEvents = '';
          if (video) video.play().catch(() => {});
        } else {
          if (video) video.pause();
          if (entry.boundingClientRect.top < navH + 40) {
            // Sorti par le haut (sous la nav) → fade out
            entry.target.style.transition = `opacity ${FADE}ms ${EASING}`;
            entry.target.style.opacity = '0.1';
            entry.target.style.pointerEvents = 'none';
          } else {
            // Sorti par le bas → opacité normale
            entry.target.style.transition = 'none';
            entry.target.style.opacity = '';
            entry.target.style.pointerEvents = '';
          }
        }
      });
    },
    { rootMargin: `-${navH + 40}px 0px 0px 0px`, threshold: 0 }
  );
  items.forEach(item => fadeObserver.observe(item));
}

// ── Category filtering (single-select) ───────────────────
function onCategoryClick(btn) {
  const category = btn.dataset.categories;

  if (activeCategory === category) {
    activeCategory = null;
    btn.classList.remove('active');
  } else {
    categoryButtons.forEach(b => b.classList.remove('active'));
    activeCategory = category;
    btn.classList.add('active');
  }

  applyFilter();
}

function applyFilter() {
  document.querySelectorAll('.projects-item[data-filter]').forEach(item => {
    const shouldShow = !activeCategory || activeCategory === item.dataset.filter;
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
    v.querySelectorAll('source').forEach(s => s.removeAttribute('src'));
    v.load();
  });

  // Remove all listeners + reset state
  navH = 0;
  if (fadeObserver) { fadeObserver.disconnect(); fadeObserver = null; }
  if (btnController) { btnController.abort(); btnController = null; }
  activeCategory = null;
  categoryButtons.forEach(btn => btn.classList.remove('active'));
  categoryButtons = [];

  document.querySelectorAll('.projects-item[data-filter]').forEach(item => {
    item.style.height = '';
    item.style.overflow = '';
    item.style.transition = '';
    item.style.opacity = '';
    item.style.pointerEvents = '';
  });
}
