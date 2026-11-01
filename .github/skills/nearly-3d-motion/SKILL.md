---
name: nearly-3d-motion
description: Audit, restore, and extend NEARLY Studio's CSS and JavaScript motion system without competing transforms or inaccessible motion.
---

# NEARLY 3D Motion Engineering

Use this skill for the homepage stage, comparison, ambient canvas, card tilt, visual depth, magnetic buttons, reveals, and pricing motion.

## Preserve and coordinate

- Preserve the homepage interactive browser stage, before/after comparison, ambient wireframe artwork, service-card tilt, visual-card depth, magnetic buttons, scroll reveals, and pricing animations.
- Before changing an effect, trace its element, CSS transform/individual transform properties, JavaScript writers, and shared `script.js` behavior. Give each transform property one clear owner; compose separate effects with individual properties or nested elements where appropriate.
- Load `motion-advanced.js` after `script.js` with `defer`, matching existing public pages.
- Do not add GSAP, Three.js, gyroscope permission prompts, or another animation dependency without justification and explicit approval.

## Runtime requirements

- Handle mouse, pen, and touch deliberately. Do not block vertical scrolling for decorative tilt; reset transient states on pointer up, cancel, and leave.
- Gate work by actual capability where appropriate, batch visual writes with `requestAnimationFrame`, and avoid unnecessary layout reads or continuously running loops.
- Pause canvas/continuous effects when the document is hidden or the relevant element is outside the viewport. Resize the canvas for device pixel ratio with a sensible cap.
- Respect `prefers-reduced-motion` both at startup and when the preference changes while the page is open. Stop active loops and remove/avoid ongoing JS-driven motion when reduction is requested.
- Keep content and controls usable when motion is disabled, JavaScript is unavailable, or observers are unsupported.

## Verification

- Check CSS specificity, transform ownership, event lifecycle, observer fallbacks, canvas sizing/stacking, and cache-busting references across pages.
- Test pointer and touch behavior, keyboard interaction for controls, reduced motion at load and after toggling, and responsive layouts in a real browser before claiming behavioral verification.
