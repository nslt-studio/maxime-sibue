import Swup from 'swup';
import SwupPreloadPlugin from '@swup/preload-plugin';

// ── Config ──────────────────────────────────────────────
const FADE    = 300; // ms – fade duration per element
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

  // Mirror of fadeInCategoriesItems: reset → raf → transition + value.
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
  const p1 = fadeOutProjectsLink();
  await wait(FADE / 2);
  const p2 = fadeInCategoriesItems();
  await Promise.all([p1, p2]);
}

async function navFromProjects() {
  await fadeOutCategoriesItems();
  await fadeInProjectsLink();
}

// ── Slide footer out ─────────────────────────────────────
async function slideOutFooter() {
  const footer = document.querySelector('.footer');
  if (!footer) return;

  footer.style.transition = `transform ${FADE}ms ${EASING}`;
  footer.style.transform = 'translateY(100%)';

  await wait(FADE);
}

// ── Slide footer in ──────────────────────────────────────
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

// ── Slide copyrights out ────────────────────────────────
async function slideOutCopyrights() {
  const el = document.querySelector('.copyrights');
  if (!el) return;

  el.style.transition = `transform ${FADE}ms ${EASING}`;
  el.style.transform = 'translateY(100%)';

  await wait(FADE);
}

// ── Slide copyrights in ─────────────────────────────────
async function slideInCopyrights() {
  const el = document.querySelector('.copyrights');
  if (!el) return;

  el.style.transition = 'none';
  el.style.transform = 'translateY(100%)';
  void el.offsetHeight;
  el.style.transition = `transform ${FADE}ms ${EASING}`;
  el.style.transform = 'translateY(0%)';

  await wait(FADE);
}

// ── Slide project-index out ─────────────────────────────
async function slideOutProjectIndex() {
  const el = document.querySelector('.project-index');
  if (!el) return;

  el.style.transition = `transform ${FADE}ms ${EASING}`;
  el.style.transform = 'translateY(100%)';

  await wait(FADE);
}

// ── Slide project-index in ──────────────────────────────
async function slideInProjectIndex() {
  const el = document.querySelector('.project-index');
  if (!el) return;

  el.style.transition = 'none';
  el.style.transform = 'translateY(100%)';
  void el.offsetHeight;
  el.style.transition = `transform ${FADE}ms ${EASING}`;
  el.style.transform = 'translateY(0%)';

  await wait(FADE);
}

// ── Slide video-controls out ─────────────────────────────
async function slideOutVideoControls() {
  const controls = document.querySelector('.video-controls');
  if (!controls) return;

  controls.style.transition = `transform ${FADE}ms ${EASING}`;
  controls.style.transform = 'translateY(100%)';

  await wait(FADE);
}

// ── Slide video-controls in ──────────────────────────────
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

// ── Fade nav out (entering details) ──────────────────────
async function fadeOutNav() {
  const nav = document.querySelector('.nav');
  if (!nav) return;

  nav.style.transition = `opacity ${FADE}ms ${EASING}`;
  nav.style.opacity = '0';
  nav.style.pointerEvents = 'none';

  await wait(FADE);
}

// ── Fade nav in (leaving details) ────────────────────────
async function fadeInNav() {
  const nav = document.querySelector('.nav');
  if (!nav) return;

  nav.style.transition = 'none';
  nav.style.opacity = '0';
  await raf();

  nav.style.transition = `opacity ${FADE}ms ${EASING}`;
  nav.style.opacity = '1';
  nav.style.pointerEvents = '';

  await wait(FADE);
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

  // Stagger fade out top → bottom in each column simultaneously
  [col1, col2, col3].forEach(col => {
    col.forEach((el, i) => {
      const delay = i * STAGGER;
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

  // Header visible, all children hidden
  header.style.transition = 'none';
  header.style.opacity = '1';
  allElements.forEach(el => {
    el.style.transition = 'none';
    el.style.opacity = '0';
  });
  await raf();

  // Fade in each column with internal stagger (all columns start at the same time)
  [col1, col2, col3].forEach(col => {
    col.forEach((el, i) => {
      const delay = i * STAGGER;
      el.style.transition = `opacity ${FADE}ms ${EASING} ${delay}ms`;
      el.style.opacity = '1';
    });
  });

  const maxLen = Math.max(col1.length, col2.length, col3.length);
  if (maxLen > 0) {
    await wait(FADE + (maxLen - 1) * STAGGER);
  }
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

// ── Detect destination namespace from URL ────────────────
function detectDestination(visit) {
  const el = visit.trigger.el;

  // From trigger element (click navigation)
  if (el) {
    return {
      goingToProjects: !!el.closest('[data-link="projects"]'),
      goingToHome: !!el.closest('[data-link="home"]'),
      goingToInfo: !!el.closest('[data-link="information"]'),
      goingToDetails: !!el.closest('[data-page="details"]') ||
        (!el.closest('[data-link]') && !el.closest('#close')),
    };
  }

  // Fallback: parse destination URL (popstate / back-forward)
  const url = (visit.to.url || '').replace(/\/$/, '') || '/';
  return {
    goingToProjects: url === '/projects',
    goingToHome: url === '/',
    goingToInfo: url === '/informations',
    goingToDetails: url.startsWith('/projects/'),
  };
}

// ── Safety: ensure persistent elements match final state ─
function ensurePersistentState(ns) {
  const nav = document.querySelector('.nav');
  const copyrights = document.querySelector('.copyrights');
  const projectIndex = document.querySelector('.project-index');

  if (ns === 'details') {
    if (nav) { nav.style.opacity = '0'; nav.style.pointerEvents = 'none'; }
  } else {
    if (nav) {
      nav.style.transition = '';
      nav.style.opacity = '1';
      nav.style.pointerEvents = '';
    }
    if (copyrights) { copyrights.style.transform = ''; copyrights.style.transition = ''; }
    if (projectIndex) { projectIndex.style.transform = ''; projectIndex.style.transition = ''; }
  }
}

// ── Init Swup ───────────────────────────────────────────
export function initSwup({ initCurrentPage, cleanupCurrentPage }) {
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

    // Entering details: store return info only from non-details pages
    if (toNs === 'details' && previousNs !== 'details') {
      detailsEnteredFrom = previousNs;
      window.__detailsEnteredFrom = previousNs;
      window.__detailsReturnUrl = previousUrl || '/';
    }

    // Leaving details: reset state
    if (leavingDetails && toNs !== 'details') {
      detailsEnteredFrom = null;
      window.__detailsEnteredFrom = null;
      window.__detailsReturnUrl = null;
    }

    initCurrentPage();
  });

  // ── Out animation ──
  swup.hooks.replace('animation:out:await', async (visit, args, defaultHandler) => {
    const fromNs = getNamespace();

    // Capture namespace + URL from visit object (reliable, set before hooks)
    previousNs = fromNs;
    previousUrl = visit.from.url;

    const { goingToProjects, goingToHome, goingToDetails, goingToInfo } = detectDestination(visit);

    leavingProjects = fromNs === 'projects' && !goingToProjects;
    leavingDetails = fromNs === 'details';

    // Footer out logic
    const hasFooter = fromNs === 'projects' || fromNs === 'information';
    const footer = document.querySelector('.footer');
    const footerVisible = footer ? footer.getBoundingClientRect().top < window.innerHeight : false;
    const shouldAnimateFooter = hasFooter && (
      goingToHome || goingToDetails ||
      (fromNs === 'information' && goingToProjects) ||
      (fromNs === 'projects' && goingToInfo && !footerVisible)
    );

    // Footer in flag (for next page – NOT details, handled separately)
    animateFooterIn = (fromNs === 'home' && !goingToDetails) ||
      (fromNs === 'information' && goingToProjects) ||
      (fromNs === 'projects' && goingToInfo && !footerVisible);

    const promises = [defaultHandler(visit, args)];

    // Home leave: slide out video-controls (unless going to details)
    if (fromNs === 'home' && !goingToDetails) {
      promises.push(slideOutVideoControls());
    }

    // Footer
    if (shouldAnimateFooter) promises.push(slideOutFooter());

    // Projects nav transitions
    if (goingToProjects && !leavingDetails) promises.push(navToProjects());
    if (leavingProjects && !goingToDetails) promises.push(navFromProjects());

    // Copyrights out when going to details from home/projects
    if (goingToDetails && (fromNs === 'home' || fromNs === 'projects')) {
      promises.push(slideOutCopyrights());
    }

    // Nav hide when going to details (from any page)
    if (goingToDetails) {
      if (fromNs === 'projects') {
        // Stagger out categories, then overlap nav fade (same pattern as navFromProjects)
        promises.push((async () => {
          const p1 = fadeOutCategoriesItems();
          await wait(FADE / 2);
          const p2 = fadeOutNav();
          await Promise.all([p1, p2]);
        })());
      } else {
        promises.push(fadeOutNav());
      }
    }

    // Leaving details
    if (leavingDetails) {
      promises.push(fadeOutProjectHeader());
      promises.push(animateOutProjectProgress());
      // Video-controls: only animate if we entered from projects
      if (detailsEnteredFrom === 'projects') {
        promises.push(slideOutVideoControls());
      }
      // Project-index out (always when leaving details)
      promises.push(slideOutProjectIndex());
    }

    await Promise.all(promises);
  });

  // ── In animation ──
  swup.hooks.replace('animation:in:await', async (visit, args, defaultHandler) => {
    const toNs = getNamespace();
    const hasFooter = toNs === 'projects' || toNs === 'information';

    const promises = [defaultHandler(visit, args)];

    // Standard: slide in video-controls for home (unless coming from details)
    if (toNs === 'home' && !leavingDetails) {
      promises.push(slideInVideoControls());
    }

    // Standard: slide in footer
    if (hasFooter && animateFooterIn) {
      promises.push(slideInFooter());
    }

    // Entering details (nav already hidden in out-animation)
    if (toNs === 'details') {
      promises.push(fadeInProjectHeader());
      promises.push(slideInProjectIndex());
      if (detailsEnteredFrom === 'projects') {
        promises.push(slideInVideoControls());
      }
    }

    // Copyrights in when leaving details to home/projects
    if (leavingDetails && (toNs === 'home' || toNs === 'projects')) {
      promises.push(slideInCopyrights());
    }

    // Leaving details → arriving elsewhere
    if (leavingDetails && toNs !== 'details') {
      if (toNs === 'projects') {
        // Hide projectsLink, keep categories items hidden (CSS default)
        const { projectsLink } = getNavElements();
        if (projectsLink) {
          projectsLink.style.transition = 'none';
          projectsLink.style.opacity = '0';
          projectsLink.style.pointerEvents = 'none';
        }
        // Fade in nav, then overlap stagger in categories
        promises.push((async () => {
          const p1 = fadeInNav();
          await wait(FADE / 2);
          const p2 = fadeInCategoriesItems();
          await Promise.all([p1, p2]);
        })());
      } else {
        resetProjectsNavState();
        promises.push(fadeInNav());
      }

      // Footer for pages that have one
      if (hasFooter) {
        promises.push(slideInFooter());
      }
    }

    await Promise.all(promises);

    // Safety: force persistent elements to correct state after animations
    ensurePersistentState(toNs);

    // Reset flag
    leavingDetails = false;
  });

  return swup;
}
