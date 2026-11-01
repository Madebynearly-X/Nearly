---
name: nearly-performance
description: Diagnose and improve browser rendering, asset loading, and animation performance in NEARLY Studio's static site.
---

# NEARLY Web Performance Engineering

Use this skill for measured performance work on public HTML, CSS, JavaScript, images, and canvas.

## Priorities

- Identify a real bottleneck before optimizing. Prefer small changes that improve loading, rendering, or interaction responsiveness without changing the design or behavior unnecessarily.
- Preserve the static-site architecture and security/cache headers. Do not add large libraries for effects already implemented with CSS or vanilla JavaScript.
- Use intrinsic image dimensions, responsive sizing, and lazy loading for below-the-fold images. Do not lazy-load a currently selected demo image if that delays its first visible render.
- Avoid forced synchronous layout, repeated DOM scans, excessive observers/listeners, and per-frame work that is not needed.
- Schedule visual updates with `requestAnimationFrame`; stop continuous canvas or animation work when hidden, off-screen, or reduced motion is requested.
- Cap canvas device-pixel ratio and keep animation work proportional to the viewport/device capability.
- Treat CSS/JS query strings as cache keys because `_headers` uses long-lived immutable caching. Coordinate version changes across every page loading a changed asset.

## Verification

Use safe, focused checks and compare actual measurements when available. Do not claim a performance improvement based only on code shape; report the device, browser, scenario, and measurements used.
