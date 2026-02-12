import Swup from 'swup';
import SwupPreloadPlugin from '@swup/preload-plugin';

// ── Config ──────────────────────────────────────────────
const FADE    = 300; // ms – fade duration per element
const STAGGER = 50;  // ms – delay between each categories-item

// ── Helpers ─────────────────────────────────────────────
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getNamespace() {
  return document.querySelector('#swup')?.dataset.namespace || null;
}

function raf() {
  return new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
}

function getNavElements() {
  const projectsLink = document.querySelector('[data-link="projects"]');
  const categories = projectsLink?.parentElement?.querySelector('.categories');
  const items = categories ? [...categories.querySelectorAll('.categories-item')] : [];
  return { projectsLink, categories, items };
}

// ── Fade projectsLink out (immediate, no raf delay) ─────
async function fadeOutProjectsLink() {
  const { projectsLink } = getNavElements();
  if (!projectsLink) return;

  projectsLink.style.transition = `opacity ${FADE}ms ease`;
  void projectsLink.offsetHeight; // force reflow so transition starts instantly
  projectsLink.style.opacity = '0';
  projectsLink.style.pointerEvents = 'none';

  await wait(FADE);
}

// ── Fade projectsLink in ────────────────────────────────
async function fadeInProjectsLink() {
  const { projectsLink } = getNavElements();
  if (!projectsLink) return;

  projectsLink.style.transition = 'none';
  projectsLink.style.opacity = '0';
  await raf();

  projectsLink.style.transition = `opacity ${FADE}ms ease`;
  projectsLink.style.opacity = '1';
  projectsLink.style.pointerEvents = '';

  await wait(FADE);
}

// ── Stagger fade in categories-items (first → last) ─────
async function fadeInCategoriesItems() {
  const { categories, items } = getNavElements();
  if (!categories || !items.length) return;

  items.forEach(item => {
    item.style.transition = 'none';
    item.style.opacity = '0';
  });
  await raf();

  categories.style.pointerEvents = 'auto';
  items.forEach((item, i) => {
    const delay = i * STAGGER;
    item.style.transition = `opacity ${FADE}ms ease ${delay}ms`;
    item.style.opacity = '1';
  });

  await wait(FADE + (items.length - 1) * STAGGER);
}

// ── Stagger fade out categories-items (last → first) ────
async function fadeOutCategoriesItems() {
  const { categories, items } = getNavElements();
  if (!categories || !items.length) return;

  const last = items.length - 1;
  items.forEach((item, i) => {
    const delay = (last - i) * STAGGER;
    item.style.transition = `opacity ${FADE}ms ease ${delay}ms`;
    item.style.opacity = '0';
  });

  await wait(FADE + last * STAGGER);
  categories.style.pointerEvents = 'none';
}

// ── Set nav to "projects active" state (no animation) ───
export function setProjectsNavState() {
  const { projectsLink, categories, items } = getNavElements();
  if (!projectsLink || !categories) return;

  projectsLink.style.transition = 'none';
  projectsLink.style.opacity = '0';
  projectsLink.style.pointerEvents = 'none';

  categories.style.pointerEvents = 'auto';
  items.forEach(item => {
    item.style.transition = 'none';
    item.style.opacity = '1';
  });
}

// ── Reset nav to default state (no animation) ───────────
export function resetProjectsNavState() {
  const { projectsLink, categories, items } = getNavElements();
  if (!projectsLink || !categories) return;

  projectsLink.style.transition = 'none';
  projectsLink.style.opacity = '1';
  projectsLink.style.pointerEvents = '';

  categories.style.pointerEvents = 'none';
  items.forEach(item => {
    item.style.transition = 'none';
    item.style.opacity = '0';
  });
}

// ── Init Swup ───────────────────────────────────────────
export function initSwup({ initCurrentPage, cleanupCurrentPage }) {
  const swup = new Swup({
    containers: ['#swup'],
    animationSelector: '[class*="transition-"]',
    plugins: [new SwupPreloadPlugin()],
  });

  let leavingProjects = false;

  // ── Page lifecycle ──
  swup.hooks.before('content:replace', () => {
    cleanupCurrentPage();
  });

  swup.hooks.on('content:replace', () => {
    initCurrentPage();
  });

  // ── Out animation ──
  // Runs immediately on click → fade-outs start with zero delay
  swup.hooks.replace('animation:out:await', async (visit, args, defaultHandler) => {
    const fromNs = getNamespace();
    const goingToProjects = !!visit.trigger.el?.closest('[data-link="projects"]');
    leavingProjects = fromNs === 'projects' && !goingToProjects;

    const promises = [defaultHandler(visit, args)];

    if (goingToProjects)  promises.push(fadeOutProjectsLink());
    if (leavingProjects)  promises.push(fadeOutCategoriesItems());

    await Promise.all(promises);
  });

  // ── In animation ──
  // Runs after content swap → fade-ins appear on the new page
  swup.hooks.replace('animation:in:await', async (visit, args, defaultHandler) => {
    const toNs = getNamespace();
    const promises = [defaultHandler(visit, args)];

    if (toNs === 'projects')  promises.push(fadeInCategoriesItems());
    if (leavingProjects)      promises.push(fadeInProjectsLink());

    await Promise.all(promises);
  });

  return swup;
}
