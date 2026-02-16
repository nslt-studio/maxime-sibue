let clockInterval = null;

export function initGlobal(swup) {
  updateActiveLink();
  startFooterClock();

  swup.hooks.on('page:view', () => {
    updateActiveLink();
  });

  swup.hooks.before('content:replace', () => {
    stopFooterClock();
  });

  swup.hooks.on('content:replace', () => {
    startFooterClock();
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

// Footer clock (#currentYear + #currentTime CET)
function startFooterClock() {
  const yearEl = document.querySelector('#currentYear');
  const timeEl = document.querySelector('#currentTime');

  if (yearEl) yearEl.textContent = new Date().getFullYear();

  if (timeEl) {
    const update = () => {
      timeEl.textContent = new Date().toLocaleTimeString('fr-FR', {
        timeZone: 'Europe/Paris',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }) + ' CET';
    };
    update();
    clockInterval = setInterval(update, 1000);
  }
}

function stopFooterClock() {
  if (clockInterval) {
    clearInterval(clockInterval);
    clockInterval = null;
  }
}
