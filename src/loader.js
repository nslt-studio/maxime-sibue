const FADE = 400;
const EASING = 'cubic-bezier(0.4, 0, 0.2, 1)';
const STEP = 100;       // ms between each item
const HOLD = 300;      // ms to hold last item before collapsing
const KEY = 'loaderDone';

export function runLoader() {
  if (sessionStorage.getItem(KEY)) {
    hideLoaderInstant();
    return;
  }

  const loader = document.querySelector('.loader');
  const items = loader ? [...loader.querySelectorAll('.loader-item')] : [];
  if (!loader || !items.length) return;

  // Ensure all items start hidden
  items.forEach(item => { item.style.opacity = '0'; });

  let i = 0;

  const interval = setInterval(() => {
    // Hide previous
    if (i > 0) items[i - 1].style.opacity = '0';

    // Show current
    items[i].style.opacity = '1';

    i++;

    if (i >= items.length) {
      clearInterval(interval);
      // Last item stays visible, wait then collapse
      setTimeout(() => collapseLoader(loader), HOLD);
    }
  }, STEP);
}

function collapseLoader(loader) {
  const h = loader.offsetHeight;
  loader.style.height = h + 'px';
  loader.style.overflow = 'hidden';
  void loader.offsetHeight; // force reflow
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
