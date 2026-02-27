const FADE = 400;
const EASING = 'cubic-bezier(0.4, 0, 0.2, 1)';
const STEP = 100;   // ms between each item
const HOLD = 300;   // ms to hold last item before collapsing
const KEY = 'loaderDone';

export function runLoader() {
  if (sessionStorage.getItem(KEY)) {
    hideLoaderInstant();
    return;
  }

  const loader = document.querySelector('.loader');
  const items = loader ? [...loader.querySelectorAll('.loader-item')] : [];
  if (!loader || !items.length) return;

  // Freeze height immediately — before video loading can trigger layout shifts
  loader.style.height = loader.offsetHeight + 'px';
  loader.style.overflow = 'hidden';

  // Start all items hidden
  items.forEach(item => { item.style.opacity = '0'; });

  let index = -1;
  let lastTime = null;

  function step(now) {
    if (lastTime === null) lastTime = now;

    // Only advance when STEP ms have elapsed in real rendering time.
    // Using rAF timestamps (not setInterval) prevents catch-up flooding
    // when the browser is busy (video decoding, layout, etc.).
    if (now - lastTime >= STEP) {
      if (index >= 0) items[index].style.opacity = '0';
      index++;
      lastTime = now;

      if (index < items.length) items[index].style.opacity = '1';

      if (index >= items.length - 1) {
        // All items have cycled — wait HOLD ms, then prime the browser
        // with a double-rAF before starting the height transition.
        setTimeout(() => {
          requestAnimationFrame(() => requestAnimationFrame(() => collapseLoader(loader)));
        }, HOLD);
        return;
      }
    }

    requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
}

function collapseLoader(loader) {
  // Height is already frozen (set at startup), just animate to 0
  loader.style.transition = `height ${FADE}ms ${EASING}`;
  loader.style.height = '0px';

  loader.addEventListener('transitionend', () => {
    loader.remove();
    sessionStorage.setItem(KEY, '1');
  }, { once: true });
}

function hideLoaderInstant() {
  const loader = document.querySelector('.loader');
  if (loader) loader.remove();
}
