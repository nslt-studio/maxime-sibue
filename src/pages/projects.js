import { wait } from '../utils.js';

const FADE = 300;
const EASING = 'cubic-bezier(0.4, 0, 0.2, 1)';

let activeCategory = null;
let categoryButtons = [];
let btnController = null;
let fadeObserver = null;
let isFiltering = false;
let observedItems = [];

export function initProjects() {
  const items = document.querySelectorAll('.projects-item');
  if (!items.length) return;

  observedItems = [...items];

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
    item.style.display = '';
  });

  observedItems.forEach(item => {
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
}

// ── Freeze (stop media before out-animation) ─────────────
export function freezeProjects() {
  document.querySelectorAll('.projects-cover-inner video').forEach(v => v.pause());
}

// ── Start (begin observing after in-animation) ───────────
export function startProjects() {
  fadeObserver = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        const video = entry.target.querySelector('.projects-cover-inner video');
        if (entry.isIntersecting) {
          if (video) video.play().catch(() => {});
        } else {
          if (video) video.pause();
        }
      });
    },
    { threshold: 0 }
  );
  observedItems.forEach(item => fadeObserver.observe(item));
}

// ── Category filtering (single-select) ───────────────────
async function onCategoryClick(btn) {
  if (isFiltering) return;
  isFiltering = true;

  const category = btn.dataset.categories;
  const list = document.querySelector('.projects-list');

  if (activeCategory === category) {
    activeCategory = null;
    btn.classList.remove('active');
  } else {
    categoryButtons.forEach(b => b.classList.remove('active'));
    activeCategory = category;
    btn.classList.add('active');
  }

  if (list) {
    list.style.transition = `opacity ${FADE}ms ${EASING}`;
    list.style.opacity = '0';
    await wait(FADE);
  }

  document.querySelectorAll('.projects-item[data-filter]').forEach(item => {
    const shouldShow = !activeCategory || activeCategory === item.dataset.filter;
    item.style.display = shouldShow ? '' : 'none';
  });

  if (list) {
    list.style.opacity = '1';
    await wait(FADE);
    list.style.transition = '';
  }

  isFiltering = false;
}

export function cleanupProjects() {
  // Cancel all project video downloads (free bandwidth for next page)
  document.querySelectorAll('.projects-cover-inner video').forEach(v => {
    v.pause();
    v.querySelectorAll('source').forEach(s => s.removeAttribute('src'));
    v.load();
  });

  if (fadeObserver) { fadeObserver.disconnect(); fadeObserver = null; }
  if (btnController) { btnController.abort(); btnController = null; }
  activeCategory = null;
  isFiltering = false;
  categoryButtons.forEach(btn => btn.classList.remove('active'));
  categoryButtons = [];
  observedItems = [];

  document.querySelectorAll('.projects-item[data-filter]').forEach(item => {
    item.style.display = '';
    item.style.opacity = '';
    item.style.pointerEvents = '';
  });

  const list = document.querySelector('.projects-list');
  if (list) {
    list.style.opacity = '';
    list.style.transition = '';
  }
}
