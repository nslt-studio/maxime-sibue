export function initGlobal(swup) {
  updateActiveLink();

  swup.hooks.on('page:view', () => {
    updateActiveLink();
  });
}

function updateActiveLink() {
  const namespace = document.querySelector('#swup')?.dataset.namespace;
  document.querySelectorAll('[data-link]').forEach(link => {
    link.classList.toggle('is-active', link.dataset.link === namespace);
  });
}
