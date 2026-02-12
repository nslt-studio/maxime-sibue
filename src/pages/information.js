import Player from '@vimeo/player';

let observer = null;
let playerState = null; // { player, poster, playing }

export function initInformation() {
  const container = document.querySelector('.background-full');
  if (!container) return;

  const iframe = container.querySelector('iframe');
  const poster = document.querySelector('.background-full-poster');
  if (!iframe) return;

  const player = new Player(iframe);
  player.setMuted(true);
  player.setLoop(true);

  playerState = { player, poster, playing: false };

  // Fade out poster only when video is truly playing (seconds > 0)
  player.on('timeupdate', (data) => {
    if (playerState.poster && !playerState.playing && data.seconds > 0) {
      playerState.playing = true;
      playerState.poster.style.transition = 'opacity 200ms cubic-bezier(0.4, 0, 0.2, 1)';
      playerState.poster.style.opacity = '0';
      playerState.poster.style.pointerEvents = 'none';
    }
  });

  // Play/pause based on viewport visibility
  observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        player.play().catch(() => {});
      } else {
        player.pause().catch(() => {});
      }
    });
  }, { threshold: 0.25 });

  observer.observe(container);
}

export function cleanupInformation() {
  if (observer) {
    observer.disconnect();
    observer = null;
  }

  if (playerState?.player) {
    try { playerState.player.pause(); } catch {}
  }
  playerState = null;
}
