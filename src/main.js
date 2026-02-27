import { injectStyles } from './styles.js';
import { runLoader } from './loader.js';
import { initSwup, setProjectsNavState, resetProjectsNavState, setNavHidden } from './swup.js';
import { initGlobal } from './global.js';
import { initHome, cleanupHome, freezeHome, startHome } from './pages/home.js';
import { initProjects, cleanupProjects, freezeProjects, startProjects } from './pages/projects.js';
import { initInformation, cleanupInformation, freezeInformation, startInformation } from './pages/information.js';
import { initDetails, cleanupDetails, freezeDetails, startDetails } from './pages/details.js';

// ── Page registry ───────────────────────────────────────
const pages = {
  home:        { init: initHome,        cleanup: cleanupHome,        freeze: freezeHome,        start: startHome },
  projects:    { init: initProjects,    cleanup: cleanupProjects,    freeze: freezeProjects,    start: startProjects },
  information: { init: initInformation, cleanup: cleanupInformation, freeze: freezeInformation, start: startInformation },
  details:     { init: initDetails,     cleanup: cleanupDetails,     freeze: freezeDetails,     start: startDetails },
};

function getNamespace() {
  return document.querySelector('#swup')?.dataset.namespace || null;
}

function initCurrentPage() {
  const ns = getNamespace();
  if (ns && pages[ns]) pages[ns].init();
}

function cleanupCurrentPage() {
  const ns = getNamespace();
  if (ns && pages[ns]) pages[ns].cleanup();
}

function freezeCurrentPage() {
  const ns = getNamespace();
  if (ns && pages[ns]?.freeze) pages[ns].freeze();
}

function startCurrentPage() {
  const ns = getNamespace();
  if (ns && pages[ns]?.start) pages[ns].start();
}

// ── Boot ────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  injectStyles();
  runLoader();

  const swup = initSwup({ initCurrentPage, cleanupCurrentPage, freezeCurrentPage, startCurrentPage });

  initGlobal(swup);

  // Initial page load: set nav state instantly (no animation)
  if (getNamespace() === 'projects') {
    setProjectsNavState();
  } else if (getNamespace() === 'details') {
    resetProjectsNavState();
    setNavHidden();
  } else {
    resetProjectsNavState();
  }

  initCurrentPage();
  startCurrentPage(); // No swup animation on first load — start media immediately
});
