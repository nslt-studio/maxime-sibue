let video = null;

export function initInformation() {
  const container = document.querySelector('.background-full');
  if (!container) return;

  video = container.querySelector('video');
  const poster = document.querySelector('.background-full-poster');
  if (!video) return;

  // Poster fade on first frame
  let posterHidden = false;
  video.addEventListener('timeupdate', () => {
    if (!posterHidden && poster && video.currentTime > 0) {
      posterHidden = true;
      poster.style.transition = 'opacity 200ms cubic-bezier(0.4, 0, 0.2, 1)';
      poster.style.opacity = '0';
      poster.style.pointerEvents = 'none';
    }
  });

  // Play immediately
  video.play().catch(() => {
    video.addEventListener('canplay', () => video.play().catch(() => {}), { once: true });
  });
}

export function cleanupInformation() {
  if (video) { video.pause(); video = null; }
}
