import Swup from 'swup';
import SwupPreloadPlugin from '@swup/preload-plugin';
import { wait } from './utils.js';

// ── Config ──────────────────────────────────────────────
const FADE    = 300; // ms – fade duration per element
const STAGGER = 50;  // ms – delay between each categories-item
const EASING  = 'cubic-bezier(0.4, 0, 0.2, 1)';

// ── Helpers ─────────────────────────────────────────────
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

// ── Generic slide out / slide in ─────────────────────────
async function slideOut(selector) {
  const el = document.querySelector(selector);
  if (!el) return;
  el.style.opacity = '1';
  el.style.transition = `transform ${FADE}ms ${EASING}`;
  el.style.transform = 'translateY(100%)';
  await wait(FADE);
}

async function slideIn(selector) {
  const el = document.querySelector(selector);
  if (!el) return;
  el.style.opacity = '1';
  el.style.transition = 'none';
  el.style.transform = 'translateY(100%)';
  void el.offsetHeight;
  el.style.transition = `transform ${FADE}ms ${EASING}`;
  el.style.transform = 'translateY(0%)';
  await wait(FADE);
}

// ── Generic fade out / fade in ───────────────────────────
async function fadeOut(selector) {
  const el = document.querySelector(selector);
  if (!el) return;
  el.style.transition = `opacity ${FADE}ms ${EASING}`;
  void el.offsetHeight;
  el.style.opacity = '0';
  el.style.pointerEvents = 'none';
  await wait(FADE);
}

async function fadeIn(selector) {
  const el = document.querySelector(selector);
  if (!el) return;
  el.style.transition = 'none';
  el.style.opacity = '0';
  await raf();
  el.style.transition = `opacity ${FADE}ms ${EASING}`;
  el.style.opacity = '1';
  el.style.pointerEvents = '';
  await wait(FADE);
}

// ── Stagger fade in categories-items (first → last) ─────
async function fadeInCategoriesItems() {
  const { categories, items } = getNavElements();
  if (!categories || !items.length) return;

  items.forEach(item => {
    item.getAnimations().forEach(a => a.cancel());
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

  items.forEach(item => {
    item.getAnimations().forEach(a => a.cancel());
    item.style.transition = 'none';
    item.style.opacity = '1';
  });
  await raf();

  categories.style.pointerEvents = 'none';
  items.forEach((item, i) => {
    // iOS Safari bug: transition-delay:0ms doesn't fire → use 1ms minimum.
    const delay = Math.max(1, i * STAGGER);
    item.style.transition = `opacity ${FADE}ms ${EASING} ${delay}ms`;
    item.style.opacity = '0';
  });

  await wait(FADE + (items.length - 1) * STAGGER);
}

// ── Combined nav transitions (overlap at FADE / 2) ──────
async function navToProjects() {
  const p1 = fadeOut('[data-link="projects"]');
  await wait(FADE / 2);
  const p2 = fadeInCategoriesItems();
  await Promise.all([p1, p2]);
}

async function navFromProjects() {
  await fadeOutCategoriesItems();
  await fadeIn('[data-link="projects"]');
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
    item.getAnimations().forEach(a => a.cancel());
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
    item.getAnimations().forEach(a => a.cancel());
    item.style.transition = 'none';
    item.style.opacity = '0';
  });
}

// ── Set nav hidden (no animation, for direct details load) ─
export function setNavHidden() {
  const nav = document.querySelector('.nav');
  if (!nav) return;
  nav.style.transition = 'none';
  nav.style.opacity = '0';
  nav.style.pointerEvents = 'none';
}

// ── Animate project-progress back to 0 (leaving details) ─
async function animateOutProjectProgress() {
  const progress = document.querySelector('.project-progress');
  if (!progress) return;
  progress.classList.remove('is-visible');
  await wait(2 * FADE); // matches CSS transition: width 600ms
}

// ── Stagger project-index-items out (translateX 0→-100%) ─
async function staggerOutIndexItems() {
  const items = [...document.querySelectorAll('.project-index-item')];
  if (!items.length) return;

  items.forEach((item, i) => {
    // iOS Safari bug: transition-delay:0ms doesn't fire → use 1ms minimum.
    const delay = Math.max(1, i * STAGGER);
    item.style.transition = `transform ${FADE}ms ${EASING} ${delay}ms, opacity ${FADE}ms ${EASING} ${delay}ms`;
    item.style.transform = 'translateX(-12px)';
    item.style.opacity = '0';
  });

  await wait(FADE + (items.length - 1) * STAGGER);
}

// Assumes items are already pre-hidden (transition:none, translateX(-12px), opacity:0).
async function staggerInIndexItems() {
  const items = [...document.querySelectorAll('.project-index-item')];
  if (!items.length) return;

  items.forEach((item, i) => {
    const delay = i * STAGGER;
    item.style.transition = `transform ${FADE}ms ${EASING} ${delay}ms, opacity ${FADE}ms ${EASING} ${delay}ms`;
    item.style.transform = 'translateX(0)';
    item.style.opacity = '0.4';
  });

  await wait(FADE + (items.length - 1) * STAGGER);

  // Hand off to CSS: remove inline styles so .active and :hover take over
  items.forEach(item => {
    item.style.transition = '';
    item.style.transform = '';
    item.style.opacity = '';
  });
}

// ── Get project-header animatable elements (3 columns) ───
function getHeaderColumns() {
  const header = document.querySelector('.project-header');
  if (!header) return null;

  const vertFlex = header.querySelector('.vert-flex');
  const services = header.querySelector('#services');
  const close = header.querySelector('#close');

  const col1 = vertFlex ? [...vertFlex.children] : [];
  const col2 = services ? [...services.children] : [];
  const col3 = close ? [close] : [];

  return { header, col1, col2, col3 };
}

// ── Fade out project-header (top to bottom stagger per column) ─
async function fadeOutProjectHeader() {
  const cols = getHeaderColumns();
  if (!cols) return;

  const { col1, col2, col3 } = cols;

  [col1, col2, col3].forEach(col => {
    col.forEach((el, i) => {
      // iOS Safari bug: transition-delay:0ms doesn't fire → use 1ms minimum.
      const delay = Math.max(1, i * STAGGER);
      el.style.transition = `opacity ${FADE}ms ${EASING} ${delay}ms`;
      el.style.opacity = '0';
    });
  });

  const maxLen = Math.max(col1.length, col2.length, col3.length, 1);
  await wait(FADE + (maxLen - 1) * STAGGER);
}

// ── Fade in project-header (stagger per column simultaneously) ─
async function fadeInProjectHeader() {
  const cols = getHeaderColumns();
  if (!cols) return;

  const { header, col1, col2, col3 } = cols;
  const allElements = [...col1, ...col2, ...col3];
  if (!allElements.length) return;

  header.style.transition = 'none';
  header.style.opacity = '1';
  allElements.forEach(el => {
    el.style.transition = 'none';
    el.style.opacity = '0';
  });
  await raf();

  [col1, col2, col3].forEach(col => {
    col.forEach((el, i) => {
      // iOS Safari bug: transition-delay:0ms doesn't fire → use 1ms minimum.
      const delay = Math.max(1, i * STAGGER);
      el.style.transition = `opacity ${FADE}ms ${EASING} ${delay}ms`;
      el.style.opacity = '1';
    });
  });

  const maxLen = Math.max(col1.length, col2.length, col3.length);
  if (maxLen > 0) {
    await wait(FADE + (maxLen - 1) * STAGGER);
  }
}

// ── Safety: ensure persistent elements match final state ─
function ensurePersistentState(ns) {
  const nav = document.querySelector('.nav');
  const copyrights = document.querySelector('.copyrights');

  if (ns === 'details') {
    if (nav) { nav.style.opacity = '0'; nav.style.pointerEvents = 'none'; }
  } else {
    if (nav) {
      nav.style.transition = '';
      nav.style.opacity = '1';
      nav.style.pointerEvents = '';
    }
    if (copyrights) { copyrights.style.transform = ''; copyrights.style.transition = ''; }
  }
}

// ── Detect destination namespace from URL ────────────────
function detectDestination(visit) {
  const el = visit.trigger.el;

  if (el) {
    return {
      goingToProjects: !!el.closest('[data-link="projects"]'),
      goingToHome: !!el.closest('[data-link="home"]'),
      goingToInfo: !!el.closest('[data-link="information"]'),
      goingToDetails: !!el.closest('[data-page="details"]') ||
        (!el.closest('[data-link]') && !el.closest('#close')),
    };
  }

  const url = (visit.to.url || '').replace(/\/$/, '') || '/';
  return {
    goingToProjects: url === '/projects',
    goingToHome: url === '/',
    goingToInfo: url === '/informations',
    goingToDetails: url.startsWith('/projects/'),
  };
}

// ── Init Swup ───────────────────────────────────────────
export function initSwup({ initCurrentPage, cleanupCurrentPage, freezeCurrentPage, startCurrentPage }) {
  const swup = new Swup({
    containers: ['#swup'],
    animationSelector: '[class*="transition-"]',
    plugins: [new SwupPreloadPlugin()],
  });

  // Force animations on popstate (back/forward button)
  swup.hooks.on('visit:start', (visit) => {
    if (!visit.trigger.el) {
      visit.animation.animate = true;
    }
  });

  let leavingProjects = false;
  let leavingDetails = false;
  let animateFooterIn = false;
  let detailsEnteredFrom = null; // 'home' | 'projects' | null
  let previousNs = null;
  let previousUrl = null;

  // ── Page lifecycle ──
  swup.hooks.before('content:replace', () => {
    cleanupCurrentPage();
  });

  swup.hooks.on('content:replace', () => {
    const toNs = getNamespace();

    if (toNs === 'details' && previousNs !== 'details') {
      detailsEnteredFrom = previousNs;
      window.__detailsEnteredFrom = previousNs;
      window.__detailsReturnUrl = previousUrl || '/';
    }

    if (leavingDetails && toNs !== 'details') {
      detailsEnteredFrom = null;
      window.__detailsEnteredFrom = null;
      window.__detailsReturnUrl = null;
    }

    initCurrentPage();
  });

  // ── Out animation ──
  swup.hooks.replace('animation:out:await', async (visit, args, defaultHandler) => {
    // Freeze current page media before any animation starts
    freezeCurrentPage();

    const fromNs = getNamespace();
    previousNs = fromNs;
    previousUrl = visit.from.url;

    const { goingToProjects, goingToHome, goingToDetails, goingToInfo } = detectDestination(visit);

    leavingProjects = fromNs === 'projects' && !goingToProjects;
    leavingDetails = fromNs === 'details';

    const hasFooter = fromNs === 'projects' || fromNs === 'information';
    const footer = document.querySelector('.footer');
    const footerVisible = footer ? footer.getBoundingClientRect().top < window.innerHeight : false;
    const shouldAnimateFooter = hasFooter && (
      goingToHome || goingToDetails ||
      (fromNs === 'information' && goingToProjects) ||
      (fromNs === 'projects' && goingToInfo && !footerVisible)
    );

    animateFooterIn = (fromNs === 'home' && !goingToDetails) ||
      (fromNs === 'information' && goingToProjects) ||
      (fromNs === 'projects' && goingToInfo && !footerVisible);

    if (leavingDetails) {
      await Promise.all([
        defaultHandler(visit, args),
        fadeOutProjectHeader(),
        animateOutProjectProgress(),
        staggerOutIndexItems(),
        ...(detailsEnteredFrom === 'projects' ? [slideOut('.video-controls')] : []),
      ]);
      return;
    }

    const promises = [defaultHandler(visit, args)];

    if (fromNs === 'home' && !goingToDetails) promises.push(slideOut('.video-controls'));
    if (shouldAnimateFooter) promises.push(slideOut('.footer'));
    if (goingToProjects && !leavingDetails) promises.push(navToProjects());
    if (leavingProjects && !goingToDetails) promises.push(navFromProjects());

    if (goingToDetails && (fromNs === 'home' || fromNs === 'projects')) {
      promises.push(slideOut('.copyrights'));
    }

    if (goingToDetails) {
      if (fromNs === 'projects') {
        promises.push((async () => {
          const p1 = fadeOutCategoriesItems();
          await wait(FADE / 2);
          const p2 = fadeOut('.nav');
          await Promise.all([p1, p2]);
        })());
      } else {
        promises.push(fadeOut('.nav'));
      }
    }

    await Promise.all(promises);
  });

  // ── In animation ──
  swup.hooks.replace('animation:in:await', async (visit, args, defaultHandler) => {
    const toNs = getNamespace();
    const hasFooter = toNs === 'projects' || toNs === 'information';

    // Pre-hide all slide-in elements before defaultHandler fires to prevent FOUC.
    // Sets opacity:'1' explicitly to override html.is-animating CSS rule (opacity:0).
    function preHideSlide(selector) {
      const el = document.querySelector(selector);
      if (!el) return;
      el.style.opacity = '1';
      el.style.transition = 'none';
      el.style.transform = 'translateY(100%)';
    }

    if (toNs === 'details') {
      const cols = getHeaderColumns();
      if (cols) {
        const { header, col1, col2, col3 } = cols;
        header.style.transition = 'none';
        header.style.opacity = '1';
        [...col1, ...col2, ...col3].forEach(el => {
          el.style.transition = 'none';
          el.style.opacity = '0';
        });
      }
      // Pre-hide index items before fade-in to prevent FOUC
      document.querySelectorAll('.project-index-item').forEach(item => {
        item.style.transition = 'none';
        item.style.transform = 'translateX(-12px)';
        item.style.opacity = '0';
      });
      if (detailsEnteredFrom === 'projects') preHideSlide('.video-controls');
      await raf();

      await Promise.all([
        defaultHandler(visit, args),
        fadeInProjectHeader(),
        staggerInIndexItems(),
        ...(detailsEnteredFrom === 'projects' ? [slideIn('.video-controls')] : []),
      ]);
      ensurePersistentState(toNs);
      leavingDetails = false;
      startCurrentPage();
      return;
    }

    if (toNs === 'home' && !leavingDetails) preHideSlide('.video-controls');
    if (hasFooter && animateFooterIn)       preHideSlide('.footer');
    if (leavingDetails && (toNs === 'home' || toNs === 'projects')) preHideSlide('.copyrights');

    const promises = [defaultHandler(visit, args)];

    if (toNs === 'home' && !leavingDetails) promises.push(slideIn('.video-controls'));
    if (hasFooter && animateFooterIn) promises.push(slideIn('.footer'));

    if (leavingDetails && (toNs === 'home' || toNs === 'projects')) {
      promises.push(slideIn('.copyrights'));
    }

    if (leavingDetails && toNs !== 'details') {
      if (toNs === 'projects') {
        const { projectsLink } = getNavElements();
        if (projectsLink) {
          projectsLink.style.transition = 'none';
          projectsLink.style.opacity = '0';
          projectsLink.style.pointerEvents = 'none';
        }
        promises.push((async () => {
          const p1 = fadeIn('.nav');
          await wait(FADE / 2);
          const p2 = fadeInCategoriesItems();
          await Promise.all([p1, p2]);
        })());
      } else {
        resetProjectsNavState();
        promises.push(fadeIn('.nav'));
      }

      if (hasFooter) promises.push(slideIn('.footer'));
    }

    await Promise.all(promises);

    ensurePersistentState(toNs);
    leavingDetails = false;
    startCurrentPage();
  });

  return swup;
}
