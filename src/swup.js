import Swup from 'swup';
import SwupPreloadPlugin from '@swup/preload-plugin';

// ── Config ──────────────────────────────────────────────
const FADE    = 200; // ms – fade duration per element
const STAGGER = 50;  // ms – delay between each categories-item
const EASING  = 'cubic-bezier(0.4, 0, 0.2, 1)';

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

  projectsLink.style.transition = `opacity ${FADE}ms ${EASING}`;
  void projectsLink.offsetHeight;
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

  projectsLink.style.transition = `opacity ${FADE}ms ${EASING}`;
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
    item.style.transition = `opacity ${FADE}ms ${EASING} ${delay}ms`;
    item.style.opacity = '1';
  });

  await wait(FADE + (items.length - 1) * STAGGER);
}

// ── Stagger fade out categories-items (first → last) ────
async function fadeOutCategoriesItems() {
  const { categories, items } = getNavElements();
  if (!categories || !items.length) return;

  items.forEach((item, i) => {
    const delay = i * STAGGER;
    item.style.transition = `opacity ${FADE}ms ${EASING} ${delay}ms`;
    item.style.opacity = '0';
  });

  await wait(FADE + (items.length - 1) * STAGGER);
  categories.style.pointerEvents = 'none';
}

// ── Combined nav transitions (overlap at FADE / 2) ──────
async function navToProjects() {
  const p1 = fadeOutProjectsLink();
  await wait(FADE / 2);
  const p2 = fadeInCategoriesItems();
  await Promise.all([p1, p2]);
}

async function navFromProjects() {
  const p1 = fadeOutCategoriesItems();
  await wait(FADE / 2);
  const p2 = fadeInProjectsLink();
  await Promise.all([p1, p2]);
}

// ── Slide footer out (leaving projects/info → home) ─────
async function slideOutFooter() {
  const footer = document.querySelector('.footer');
  if (!footer) return;

  footer.style.transition = `transform ${FADE}ms ${EASING}`;
  footer.style.transform = 'translateY(100%)';

  await wait(FADE);
}

// ── Slide footer in (home → projects/info) ──────────────
async function slideInFooter() {
  const footer = document.querySelector('.footer');
  if (!footer) return;

  footer.style.transition = 'none';
  footer.style.transform = 'translateY(100%)';
  void footer.offsetHeight;
  footer.style.transition = `transform ${FADE}ms ${EASING}`;
  footer.style.transform = 'translateY(0%)';

  await wait(FADE);
}

// ── Slide video-controls out (home page leave) ──────────
async function slideOutVideoControls() {
  const controls = document.querySelector('.video-controls');
  if (!controls) return;

  controls.style.transition = `transform ${FADE}ms ${EASING}`;
  controls.style.transform = 'translateY(100%)';

  await wait(FADE);
}

// ── Slide video-controls in (home page enter via Swup) ──
async function slideInVideoControls() {
  const controls = document.querySelector('.video-controls');
  if (!controls) return;

  controls.style.transition = 'none';
  controls.style.transform = 'translateY(100%)';
  void controls.offsetHeight;
  controls.style.transition = `transform ${FADE}ms ${EASING}`;
  controls.style.transform = 'translateY(0%)';

  await wait(FADE);
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
  let animateFooterIn = false;

  // ── Page lifecycle ──
  swup.hooks.before('content:replace', () => {
    cleanupCurrentPage();
  });

  swup.hooks.on('content:replace', () => {
    initCurrentPage();
  });

  // ── Out animation ──
  swup.hooks.replace('animation:out:await', async (visit, args, defaultHandler) => {
    const fromNs = getNamespace();
    const goingToProjects = !!visit.trigger.el?.closest('[data-link="projects"]');
    const goingToHome = !!visit.trigger.el?.closest('[data-link="home"]');
    leavingProjects = fromNs === 'projects' && !goingToProjects;

    const hasFooter = fromNs === 'projects' || fromNs === 'information';
    const goingToInfo = !!visit.trigger.el?.closest('[data-link="information"]');
    // Projects → Info: animate only if footer is not visible in viewport
    const footer = document.querySelector('.footer');
    const footerVisible = footer ? footer.getBoundingClientRect().top < window.innerHeight : false;
    const shouldAnimateFooter = hasFooter && (
      goingToHome ||
      (fromNs === 'information' && goingToProjects) ||
      (fromNs === 'projects' && goingToInfo && !footerVisible)
    );
    animateFooterIn = fromNs === 'home' ||
      (fromNs === 'information' && goingToProjects) ||
      (fromNs === 'projects' && goingToInfo && !footerVisible);

    const promises = [defaultHandler(visit, args)];

    if (fromNs === 'home')    promises.push(slideOutVideoControls());
    if (shouldAnimateFooter)  promises.push(slideOutFooter());
    if (goingToProjects)      promises.push(navToProjects());
    if (leavingProjects)      promises.push(navFromProjects());

    await Promise.all(promises);
  });

  // ── In animation ──
  swup.hooks.replace('animation:in:await', async (visit, args, defaultHandler) => {
    const toNs = getNamespace();
    const hasFooter = toNs === 'projects' || toNs === 'information';

    const promises = [defaultHandler(visit, args)];

    if (toNs === 'home')              promises.push(slideInVideoControls());
    if (hasFooter && animateFooterIn) promises.push(slideInFooter());

    await Promise.all(promises);
  });

  return swup;
}
