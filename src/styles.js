const DURATION = 300;
const EASING = 'cubic-bezier(0.4, 0, 0.2, 1)';

export function injectStyles() {
  const css = `
    /* === PAGE TRANSITION (FADE) === */
    .transition-fade {
      opacity: 1;
      transition: opacity ${DURATION}ms ${EASING};
    }

    html.is-animating .transition-fade {
      opacity: 0;
    }

    /* === CATEGORIES NAV (items hidden by default, managed by swup.js) === */
    .categories-item {
      opacity: 0;
    }

    /* === SELECTED CAROUSEL (HOME) === */
    .selected-progress {
      opacity: 0;
      transition: opacity ${DURATION}ms ${EASING};
    }

    .selected-item.active .selected-progress,
    .selected-item.active .selected-cover {
      opacity: 1;
    }

    .selected-item.active .selected-cover {
      -webkit-mask-image: linear-gradient(
        to right,
        rgba(0,0,0,1) var(--progress, 0%),
        rgba(0,0,0,0.4) var(--progress, 0%)
      );
      mask-image: linear-gradient(
        to right,
        rgba(0,0,0,1) var(--progress, 0%),
        rgba(0,0,0,0.4) var(--progress, 0%)
      );
    }

    /* === DETAILS PAGE === */
    .progress-bar {
      transform-origin: left;
    }

    /* === PROJECT PROGRESS BAR (details page, CSS animation) === */
    .project-progress {
      width: 0;
      transition: width ${2 * DURATION}ms ${EASING};
    }

    .project-progress.is-visible {
      width: 100%;
    }
  `;

  const style = document.createElement('style');
  style.setAttribute('data-maxime-sibue', '');
  style.textContent = css;
  document.head.appendChild(style);
}
