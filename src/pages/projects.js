import Player from '@vimeo/player';

const FADE = 200;
const EASING = 'cubic-bezier(0.4, 0, 0.2, 1)';

let observer = null;
let players = new Map(); // iframe → { player, poster, playing }
let activeCategory = null;
let categoryButtons = [];

export function initProjects() {
  const items = document.querySelectorAll('.projects-item');
  if (!items.length) return;

  // Category filtering
  categoryButtons = [...document.querySelectorAll('.categories-button[data-categories]')];
  categoryButtons.forEach(btn => {
    btn.addEventListener('click', () => onCategoryClick(btn));
  });

  observer = new IntersectionObserver(onIntersect, { threshold: 0.25 });

  items.forEach(item => {
    const coverInner = item.querySelector('.projects-cover-inner');
    if (!coverInner) return;

    const iframe = coverInner.querySelector('.projects-cover iframe');
    const poster = coverInner.querySelector('.projects-cover-poster');
    if (!iframe) return;

    // Store original src then clear it to prevent loading offscreen
    const src = iframe.src || iframe.dataset.src;
    if (!src) return;

    // Fetch aspect-ratio immediately via Vimeo oEmbed (no iframe needed)
    const videoId = src.match(/player\.vimeo\.com\/video\/(\d+)/)?.[1];
    if (videoId) {
      const h = src.match(/[?&]h=([a-f0-9]+)/)?.[1];
      const vimeoUrl = h
        ? `https://vimeo.com/${videoId}/${h}`
        : `https://vimeo.com/${videoId}`;
      fetch(`https://vimeo.com/api/oembed.json?url=${encodeURIComponent(vimeoUrl)}`)
        .then(r => r.json())
        .then(data => {
          if (data.width && data.height) {
            coverInner.style.aspectRatio = `${data.width} / ${data.height}`;
          }
        })
        .catch(() => {});
    }

    iframe.dataset.src = src;
    iframe.removeAttribute('src');

    players.set(iframe, { player: null, poster, coverInner, loaded: false, playing: false });
    observer.observe(item);
  });
}

function onIntersect(entries) {
  entries.forEach(entry => {
    const item = entry.target;
    const iframe = item.querySelector('.projects-cover iframe');
    if (!iframe) return;

    const state = players.get(iframe);
    if (!state) return;

    if (entry.isIntersecting) {
      // Lazy-load: set src if not yet loaded
      if (!state.loaded) {
        iframe.src = iframe.dataset.src;
        state.loaded = true;

        const player = new Player(iframe);
        state.player = player;
        player.setMuted(true);
        player.setLoop(true);

        // Fade out poster only when video is truly playing (seconds > 0)
        player.on('timeupdate', (data) => {
          if (state.poster && !state.playing && data.seconds > 0) {
            state.playing = true;
            state.poster.style.transition = 'opacity 200ms cubic-bezier(0.4, 0, 0.2, 1)';
            state.poster.style.opacity = '0';
            state.poster.style.pointerEvents = 'none';
          }
        });

        player.ready().then(() => {
          // Only play if still in viewport
          if (entry.isIntersecting) {
            player.play().catch(() => {});
          }
        });
      } else if (state.player) {
        state.player.play().catch(() => {});
      }
    } else {
      // Out of viewport → pause
      if (state.player) {
        state.player.pause().catch(() => {});
      }
    }
  });
}

// ── Category filtering ──────────────────────────────────
function onCategoryClick(btn) {
  const category = btn.dataset.categories;

  if (activeCategory === category) {
    // Same button → toggle off, show all
    btn.classList.remove('active');
    activeCategory = null;
    document.querySelectorAll('.projects-item[data-filter]').forEach(expandItem);
  } else {
    // Different button → switch filter
    if (activeCategory) {
      const prevBtn = categoryButtons.find(b => b.dataset.categories === activeCategory);
      if (prevBtn) prevBtn.classList.remove('active');
    }

    btn.classList.add('active');
    activeCategory = category;

    document.querySelectorAll('.projects-item[data-filter]').forEach(item => {
      if (item.dataset.filter === category) {
        expandItem(item);
      } else {
        collapseItem(item);
      }
    });
  }
}

function collapseItem(item) {
  if (item.style.height === '0px') return;

  const h = item.offsetHeight;
  item.style.height = h + 'px';
  item.style.overflow = 'hidden';
  item.offsetHeight; // force reflow
  item.style.transition = `height ${FADE}ms ${EASING}`;
  item.style.height = '0px';
}

function expandItem(item) {
  if (!item.style.height || item.style.height === '') return;

  item.style.transition = 'none';
  item.style.height = '';
  item.style.overflow = '';
  const h = item.offsetHeight;
  item.style.height = '0px';
  item.style.overflow = 'hidden';
  item.offsetHeight; // force reflow
  item.style.transition = `height ${FADE}ms ${EASING}`;
  item.style.height = h + 'px';

  const onEnd = () => {
    item.style.height = '';
    item.style.overflow = '';
    item.style.transition = '';
  };
  item.addEventListener('transitionend', onEnd, { once: true });
}

export function cleanupProjects() {
  if (observer) {
    observer.disconnect();
    observer = null;
  }

  players.forEach(state => {
    if (state.player) {
      try { state.player.pause(); } catch {}
    }
  });
  players.clear();

  // Reset filter state
  activeCategory = null;
  categoryButtons = [];
  document.querySelectorAll('.projects-item[data-filter]').forEach(item => {
    item.style.height = '';
    item.style.overflow = '';
    item.style.transition = '';
  });
}
