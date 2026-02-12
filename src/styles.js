const DURATION = 300;

export function injectStyles() {
  const css = `
    /* === PAGE TRANSITION (FADE) === */
    .transition-fade {
      opacity: 1;
      transition: opacity ${DURATION}ms ease;
    }

    html.is-animating .transition-fade {
      opacity: 0;
    }

    /* === CATEGORIES NAV === */
    .categories {
      opacity: 0;
      pointer-events: none;
      transition: opacity ${DURATION}ms ease;
    }

    .categories-item {
      opacity: 0;
      transform: translateY(-100%);
      transition:
        opacity ${DURATION}ms ease var(--stagger-delay, 0ms),
        transform ${DURATION}ms ease var(--stagger-delay, 0ms);
    }

    .categories-item.is-visible {
      opacity: 1;
      transform: translateY(0%);
    }

    /* === PROJECTS LINK === */
    [data-link="projects"] {
      transition: opacity ${DURATION}ms ease, transform ${DURATION}ms ease;
    }
  `;

  const style = document.createElement('style');
  style.setAttribute('data-maxime-sibue', '');
  style.textContent = css;
  document.head.appendChild(style);
}
