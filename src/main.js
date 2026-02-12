import { injectStyles } from './styles.js';
import { initSwup, resetProjectsNavState } from './swup.js';
import { initGlobal } from './global.js';
import { initHome, cleanupHome } from './pages/home.js';
import { initProjects, cleanupProjects } from './pages/projects.js';
import { initInformation, cleanupInformation } from './pages/information.js';

// ── Page registry ───────────────────────────────────────
const pages = {
  home:        { init: initHome,        cleanup: cleanupHome },
  projects:    { init: initProjects,    cleanup: cleanupProjects },
  information: { init: initInformation, cleanup: cleanupInformation },
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

// ── Boot ────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  injectStyles();

  const swup = initSwup({ initCurrentPage, cleanupCurrentPage });

  initGlobal(swup);

  // If initial page is NOT projects, ensure nav is in default state
  if (getNamespace() !== 'projects') {
    resetProjectsNavState();
  }

  // Init the page we landed on
  initCurrentPage();
});
