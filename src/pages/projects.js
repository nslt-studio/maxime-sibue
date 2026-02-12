import { setProjectsNavState } from '../swup.js';

export function initProjects() {
  // Set nav to "projects active" state immediately (no animation)
  // This handles direct page load on /projects
  setProjectsNavState();
}

export function cleanupProjects() {
  // Cleanup before leaving projects page
}
