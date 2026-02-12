export function initGlobal(swup) {
  updateActiveLink();
  watchIframes();

  swup.hooks.on('page:view', () => {
    updateActiveLink();
  });

  swup.hooks.on('content:replace', () => {
    watchIframes();
  });
}

function updateActiveLink() {
  const namespace = document.querySelector('#swup')?.dataset.namespace;
  document.querySelectorAll('[data-link]').forEach(link => {
    const isActive = link.dataset.link === namespace;
    link.classList.toggle('w--current', isActive);
    link.classList.toggle('is-active', isActive);
  });
}

// Fade in Vimeo iframes when their content is loaded
function watchIframes() {
  document.querySelectorAll('#swup iframe[src*="vimeo"]').forEach(iframe => {
    if (iframe.dataset.watched) return;
    iframe.dataset.watched = 'true';

    iframe.addEventListener('load', () => {
      iframe.style.opacity = '1';
    });
  });
}
