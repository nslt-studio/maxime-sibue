# maxime-sibue

Custom JavaScript for [maxime-sibue.com](https://maxime-sibue.com) — loaded externally on a Webflow site.

## Stack

- **Swup v4** — page transitions (fade) with preload plugin
- **Vimeo Player SDK** — video playback, muted autoplay, progress tracking
- **Vite** — bundler (single `dist/main.js` output)

## Pages

- **Home** — horizontal scroll carousel with Vimeo videos, rAF-interpolated progress bar, auto-advance on end, pause/mute controls
- **Projects** — lazy-loaded Vimeo videos (IntersectionObserver), category filtering with height collapse/expand animation
- **Information** — background Vimeo video with viewport-based play/pause

## Global features

- Nav animations (staggered categories fade, overlap transitions)
- Image fade-in on load
- Footer clock (Paris time CET)
- Aspect-ratio via Vimeo oEmbed API

## Development

```bash
npm install
npm run watch       # vite build --watch
npm run serve       # local dev server (port 8787)
npm run tunnel      # localtunnel for Webflow testing
npm run dev:live    # all three in parallel
```

## Production

The built file is served via jsDelivr:

```
https://cdn.jsdelivr.net/gh/nslt-studio/maxime-sibue@<commit-hash>/dist/main.js
```
