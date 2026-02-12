import Swup from 'swup';

// ── Config ──────────────────────────────────────────────
const DURATION = 300;      // ms – transition duration
const STAGGER  = 60;       // ms – delay between each categories-item

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

// ── Categories IN (arriving at projects) ────────────────
// Projects link fades out + slides down,
// then categories container appears,
// then each categories-item staggers in from top
async function animateCategoriesIn() {
  const projectsLink = document.querySelector('[data-link="projects"]');
  const categories = projectsLink?.parentElement?.querySelector('.categories');
  const items = categories ? [...categories.querySelectorAll('.categories-item')] : [];

  if (!projectsLink || !categories || !items.length) return;

  // 1. Fade out projects link (opacity 1 → 0, translateY 0 → 100%)
  projectsLink.style.transition = `opacity ${DURATION}ms ease, transform ${DURATION}ms ease`;
  projectsLink.style.opacity = '0';
  projectsLink.style.transform = 'translateY(100%)';
  projectsLink.style.pointerEvents = 'none';

  // 2. Show categories container
  categories.style.transition = `opacity ${DURATION}ms ease`;
  categories.style.opacity = '1';
  categories.style.pointerEvents = 'auto';

  // 3. Prepare items at starting position (above, hidden)
  items.forEach(item => {
    item.style.transition = 'none';
    item.style.opacity = '0';
    item.style.transform = 'translateY(-100%)';
  });

  await raf();

  // 4. Stagger items in (opacity 0→1, translateY -100%→0%)
  items.forEach((item, i) => {
    const delay = i * STAGGER;
    item.style.transition = `opacity ${DURATION}ms ease ${delay}ms, transform ${DURATION}ms ease ${delay}ms`;
    item.style.opacity = '1';
    item.style.transform = 'translateY(0%)';
  });

  // 5. Wait for the last item to finish
  await wait(DURATION + (items.length - 1) * STAGGER);
}

// ── Categories OUT (leaving projects) ───────────────────
// Each categories-item staggers out to bottom,
// then categories container hides,
// then projects link fades back in from top
async function animateCategoriesOut() {
  const projectsLink = document.querySelector('[data-link="projects"]');
  const categories = projectsLink?.parentElement?.querySelector('.categories');
  const items = categories ? [...categories.querySelectorAll('.categories-item')] : [];

  if (!projectsLink || !categories || !items.length) return;

  // 1. Stagger items out (opacity 1→0, translateY 0%→100%)
  items.forEach((item, i) => {
    const delay = i * STAGGER;
    item.style.transition = `opacity ${DURATION}ms ease ${delay}ms, transform ${DURATION}ms ease ${delay}ms`;
    item.style.opacity = '0';
    item.style.transform = 'translateY(100%)';
  });

  // Wait for last item to finish
  await wait(DURATION + (items.length - 1) * STAGGER);

  // 2. Hide categories container
  categories.style.transition = 'none';
  categories.style.opacity = '0';
  categories.style.pointerEvents = 'none';

  // 3. Fade projects link back in (opacity 0→1, translateY -100%→0%)
  projectsLink.style.transition = 'none';
  projectsLink.style.opacity = '0';
  projectsLink.style.transform = 'translateY(-100%)';

  await raf();

  projectsLink.style.transition = `opacity ${DURATION}ms ease, transform ${DURATION}ms ease`;
  projectsLink.style.opacity = '1';
  projectsLink.style.transform = 'translateY(0%)';
  projectsLink.style.pointerEvents = '';

  await wait(DURATION);
}

// ── Set nav to "projects active" state (no animation) ───
export function setProjectsNavState() {
  const projectsLink = document.querySelector('[data-link="projects"]');
  const categories = projectsLink?.parentElement?.querySelector('.categories');
  const items = categories ? [...categories.querySelectorAll('.categories-item')] : [];

  if (!projectsLink || !categories) return;

  projectsLink.style.transition = 'none';
  projectsLink.style.opacity = '0';
  projectsLink.style.transform = 'translateY(100%)';
  projectsLink.style.pointerEvents = 'none';

  categories.style.transition = 'none';
  categories.style.opacity = '1';
  categories.style.pointerEvents = 'auto';

  items.forEach(item => {
    item.style.transition = 'none';
    item.style.opacity = '1';
    item.style.transform = 'translateY(0%)';
  });
}

// ── Reset nav to default state (no animation) ───────────
export function resetProjectsNavState() {
  const projectsLink = document.querySelector('[data-link="projects"]');
  const categories = projectsLink?.parentElement?.querySelector('.categories');
  const items = categories ? [...categories.querySelectorAll('.categories-item')] : [];

  if (!projectsLink || !categories) return;

  projectsLink.style.transition = 'none';
  projectsLink.style.opacity = '1';
  projectsLink.style.transform = 'translateY(0%)';
  projectsLink.style.pointerEvents = '';

  categories.style.transition = 'none';
  categories.style.opacity = '0';
  categories.style.pointerEvents = 'none';

  items.forEach(item => {
    item.style.transition = 'none';
    item.style.opacity = '0';
    item.style.transform = 'translateY(-100%)';
  });
}

// ── Init Swup ───────────────────────────────────────────
export function initSwup({ initCurrentPage, cleanupCurrentPage }) {
  const swup = new Swup({
    containers: ['#swup'],
    animationSelector: '[class*="transition-"]',
  });

  // ── Page lifecycle ──
  swup.hooks.before('content:replace', () => {
    cleanupCurrentPage();
  });

  swup.hooks.on('content:replace', () => {
    initCurrentPage();
  });

  // ── Out animation: replace default await to run nav + content in parallel ──
  swup.hooks.replace('animation:out:await', async (visit, args, defaultHandler) => {
    const fromNs = getNamespace();
    const promises = [defaultHandler(visit, args)];

    if (fromNs === 'projects') {
      promises.push(animateCategoriesOut());
    }

    await Promise.all(promises);
  });

  // ── In animation: replace default await to run nav + content in parallel ──
  swup.hooks.replace('animation:in:await', async (visit, args, defaultHandler) => {
    const toNs = getNamespace(); // After content:replace, DOM has new namespace
    const promises = [defaultHandler(visit, args)];

    if (toNs === 'projects') {
      promises.push(animateCategoriesIn());
    }

    await Promise.all(promises);
  });

  return swup;
}
