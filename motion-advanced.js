/**
 * motion-advanced.js  |  NEARLY Studio
 * Additive. Load with defer AFTER script.js. Same-origin, no inline code, so it
 * satisfies the site's script-src 'self' policy.
 *
 * Handles:
 *   1. Bounce on reveal
 *   2. 3D tilt on cards (mouse hover, or finger down on touch)
 *   3. Interactive pointer/touch 3D hero tilt with specular sheen
 *   4. Parallax on hero visuals
 *   5. Magnetic buttons
 *   6. Price pop on plan switch
 *   7. Before/after comparison slider
 *   8. Ambient lightweight 3D geometric wireframe canvas in hero
 */
(() => {
  'use strict';

  const instanceKey = Symbol.for('nearly.motionAdvanced');
  if (window[instanceKey]) return;
  window[instanceKey] = true;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const reducedMotionHandlers = [];
  const onReducedMotionChange = (handler) => reducedMotionHandlers.push(handler);

  /* 1. Bounce on reveal ----------------------------------------------------- */
  // Cards, price rows and the compare block spring in. Headings, FAQ rows and
  // the contact form stay on the plain fade from styles.css: text that
  // overshoots reads as nervous, and a form that bounces is harder to aim at.
  const BOUNCY = '.tile, .price-row, .cmp, .cta-band, .feature-list li';
  const bounceAnimations = new Set();

  if ('MutationObserver' in window && Element.prototype.animate && document.body) {
    const bounce =
      getComputedStyle(document.documentElement).getPropertyValue('--bounce').trim() ||
      'cubic-bezier(0.16, 1, 0.3, 1)';
    const played = new WeakSet();

    const observer = new MutationObserver((records) => {
      records.forEach(({ target: el }) => {
        if (reduced.matches || played.has(el) || !el.classList.contains('is-visible') || !el.matches(BOUNCY)) return;
        if (!el.classList.contains('reveal')) return;
        played.add(el);
        const delay = (parseFloat(getComputedStyle(el).getPropertyValue('--d')) || 0) * 1000;
        try {
          const animation = el.animate(
            [{ transform: 'translateY(36px) scale(0.96)' }, { transform: 'translateY(0) scale(1)' }],
            { duration: 800, delay, easing: bounce, fill: 'backwards' }
          );
          bounceAnimations.add(animation);
          animation.addEventListener('finish', () => bounceAnimations.delete(animation), { once: true });
          animation.addEventListener('cancel', () => bounceAnimations.delete(animation), { once: true });
        } catch (err) {
          /* Easing not supported: the CSS reveal in styles.css has already run. */
        }
      });
    });
    const observeReveals = () => {
      if (reduced.matches) {
        observer.disconnect();
        return;
      }
      observer.observe(document.body, { attributes: true, attributeFilter: ['class'], subtree: true });
    };
    observeReveals();
    onReducedMotionChange(() => {
      if (reduced.matches) {
        observer.disconnect();
        bounceAnimations.forEach((animation) => animation.cancel());
        bounceAnimations.clear();
      } else {
        observeReveals();
      }
    });
  }

  /* 2. 3D tilt on cards ------------------------------------------------------ */
  // One set of pointer events for mouse and touch. A mouse tilts on hover; a
  // finger tilts only while it is down. When the browser takes the gesture over
  // to scroll it fires pointercancel, which resets the card, so scrolling past
  // a card never leaves it tilted (the old touchmove version did).
  const tiles = document.querySelectorAll('.tile');
  const resetTileTilt = (tile) => {
    tile.classList.remove('is-touch-tilted');
    tile.style.removeProperty('--rx');
    tile.style.removeProperty('--ry');
  };
  const interactiveSelector = 'a, button, input, select, textarea, summary, [contenteditable="true"], [role="button"], [role="link"]';
  const resetTileTilts = [];

  tiles.forEach((tile) => {
    let touching = false;

    const aim = (e) => {
      if (reduced.matches) return;
      const r = tile.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      tile.style.setProperty('--rx', `${(-y * 8).toFixed(2)}deg`);
      tile.style.setProperty('--ry', `${(x * 8).toFixed(2)}deg`);
    };

    const reset = () => {
      touching = false;
      resetTileTilt(tile);
    };
    resetTileTilts.push(reset);

    tile.addEventListener('pointerdown', (e) => {
      if (reduced.matches || e.pointerType === 'mouse') return;
      if (e.target instanceof Element && e.target.closest(interactiveSelector)) return;
      touching = true;
      tile.classList.add('is-touch-tilted');
      aim(e);
    }, { passive: true });

    tile.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse' && touching && e.target instanceof Element && e.target.closest(interactiveSelector)) {
        reset();
        return;
      }
      if (!reduced.matches && (e.pointerType === 'mouse' || touching)) aim(e);
    }, { passive: true });

    ['pointerup', 'pointercancel', 'pointerleave'].forEach((type) =>
      tile.addEventListener(type, reset, { passive: true })
    );
  });
  onReducedMotionChange(() => {
    if (reduced.matches) resetTileTilts.forEach((reset) => reset());
  });

  /* 3. Interactive 3D hero stage ---------------------------------------------- */
  const stage = document.querySelector('.stage');
  const browser = document.querySelector('.browser');
  if (stage && browser) {
    let touchActive = false;

    const aim = (clientX, clientY) => {
      if (reduced.matches) return;
      const r = stage.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const x = (clientX - r.left) / r.width - 0.5;
      const y = (clientY - r.top) / r.height - 0.5;
      const rx = -y * 10;
      const ry = x * 10;
      browser.style.transform = `rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
      browser.style.setProperty('--stage-shine', Math.min(Math.max((ry - rx) * 0.04 + 0.15, 0), 0.55).toFixed(2));
    };

    stage.addEventListener('pointerdown', (e) => {
      if (reduced.matches || e.pointerType === 'mouse') return;
      touchActive = true;
      aim(e.clientX, e.clientY);
    }, { passive: true });
    stage.addEventListener('pointermove', (e) => {
      if (!reduced.matches && (e.pointerType === 'mouse' || touchActive)) aim(e.clientX, e.clientY);
    }, { passive: true });
    const reset = (e) => {
      if (e.pointerType === 'mouse') {
        if (e.type !== 'pointerleave') return;
      } else if (!touchActive) {
        return;
      }
      touchActive = false;
      browser.style.removeProperty('transform');
      browser.style.setProperty('--stage-shine', '0');
    };
    ['pointerup', 'pointercancel'].forEach((type) =>
      stage.addEventListener(type, reset, { passive: true })
    );
    stage.addEventListener('pointerleave', (e) => {
      if (e.pointerType === 'mouse' || touchActive) reset(e);
    }, { passive: true });
    onReducedMotionChange(() => {
      if (!reduced.matches) return;
      touchActive = false;
      browser.style.removeProperty('transform');
      browser.style.setProperty('--stage-shine', '0');
    });
  }

  /* 4. Parallax on hero visuals --------------------------------------------- */
  const layers = [...document.querySelectorAll('.stage, .visual-card')].map((el) => ({
    el,
    py: 0,
    start: 0,
    span: 1,
  }));
  let parallaxFrame = 0;

  if (layers.length) {
    const measure = () => {
      const vh = window.innerHeight;
      layers.forEach((layer) => {
        if (!layer.el.isConnected) return;
        const r = layer.el.getBoundingClientRect();
        const top = r.top + window.scrollY - layer.py;
        layer.start = Math.max(0, top - vh);
        layer.span = vh + r.height;
      });
    };

    let queued = false;
    const update = () => {
      queued = false;
      parallaxFrame = 0;
      if (reduced.matches) return;
      layers.forEach((layer) => {
        const progress = Math.min(Math.max(window.scrollY - layer.start, 0), layer.span);
        layer.py = Math.min(progress * 0.05, 48);
        layer.el.style.setProperty('--py', `${layer.py.toFixed(1)}px`);
      });
    };
    const schedule = () => {
      if (reduced.matches || queued) return;
      queued = true;
      parallaxFrame = requestAnimationFrame(update);
    };

    if (!reduced.matches) {
      measure();
      update();
    }
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', () => {
      if (reduced.matches) return;
      measure();
      schedule();
    }, { passive: true });
    window.addEventListener('load', () => { measure(); schedule(); }, { once: true });
    onReducedMotionChange(() => {
      if (reduced.matches) {
        if (parallaxFrame) cancelAnimationFrame(parallaxFrame);
        parallaxFrame = 0;
        queued = false;
        layers.forEach((layer) => {
          layer.py = 0;
          layer.el.style.removeProperty('--py');
        });
        return;
      }
      measure();
      schedule();
    });
  }

  /* 5. Magnetic CTAs ------------------------------------------------------- */
  const magnets = new Set([
    ...document.querySelectorAll('[data-magnetic]'),
    ...document.querySelectorAll('main .button, .cta-band .button'),
  ]);
  const resetMagnets = [];

  magnets.forEach((el) => {
    const strength = Number(el.dataset.magnetic) || 0.25;
    let frame = 0;
    let pointerX = 0;
    let pointerY = 0;

    const reset = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      el.style.removeProperty('--mag-x');
      el.style.removeProperty('--mag-y');
    };
    resetMagnets.push(reset);

    el.addEventListener('pointermove', (e) => {
      if (reduced.matches || !finePointer.matches || (e.pointerType !== 'mouse' && e.pointerType !== 'pen')) return;
      pointerX = e.clientX;
      pointerY = e.clientY;
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        if (reduced.matches || !finePointer.matches) return;
        const r = el.getBoundingClientRect();
        const dx = (pointerX - (r.left + r.width / 2)) * strength;
        const dy = (pointerY - (r.top + r.height / 2)) * strength;
        el.style.setProperty('--mag-x', `${dx.toFixed(1)}px`);
        el.style.setProperty('--mag-y', `${dy.toFixed(1)}px`);
      });
    }, { passive: true });

    el.addEventListener('pointerleave', reset, { passive: true });
  });
  onReducedMotionChange(() => {
    if (reduced.matches) resetMagnets.forEach((reset) => reset());
  });

  /* 6. Price pop on plan switch -------------------------------------------- */
  const plans = document.querySelector('[data-plans]');
  if (plans && 'MutationObserver' in window) {
    const observer = new MutationObserver((records) => {
      if (reduced.matches) return;
      const changed = new Set();
      records.forEach((record) => {
        const node = record.target.nodeType === 1 ? record.target : record.target.parentElement;
        const el = node && node.closest('[data-plan-price], [data-plan-total]');
        if (el) changed.add(el);
      });
      [...changed].forEach((el, i) => {
        el.classList.remove('is-popping');
        void el.offsetWidth;
        el.style.setProperty('--pop-delay', `${i * 45}ms`);
        el.classList.add('is-popping');
      });
    });
    const observePlans = () => {
      if (reduced.matches) {
        observer.disconnect();
        return;
      }
      observer.observe(plans, { childList: true, characterData: true, subtree: true });
    };
    observePlans();

    const clearPlanPop = (event) => {
      const el = event.target;
      if (!(el instanceof Element) || !el.classList.contains('is-popping')) return;
      el.classList.remove('is-popping');
      el.style.removeProperty('--pop-delay');
    };
    ['animationend', 'animationcancel'].forEach((type) =>
      plans.addEventListener(type, clearPlanPop)
    );
    onReducedMotionChange(() => {
      if (reduced.matches) {
        observer.disconnect();
        plans.querySelectorAll('.is-popping').forEach((el) => {
          el.classList.remove('is-popping');
          el.style.removeProperty('--pop-delay');
        });
      } else {
        observePlans();
      }
    });
  }

  /* 7. Before / after comparison -------------------------------------------- */
  document.querySelectorAll('[data-compare]').forEach((root) => {
    const stageEl = root.querySelector('[data-compare-stage]');
    const range = root.querySelector('[data-compare-range]');
    if (!stageEl || !range) return;

    const update = () => {
      const value = Number(range.value);
      stageEl.style.setProperty('--split', `${value}%`);
      range.setAttribute(
        'aria-valuetext',
        `${value}% focused page, ${100 - value}% generic template`
      );
    };

    range.addEventListener('input', update);
    range.hidden = false;
    update();
  });

  /* 8. Ambient 3D wireframe canvas in the hero -------------------------------- */
  const canvas = document.getElementById('hero-3d-ambient');
  const ctx = canvas && typeof canvas.getContext === 'function' ? canvas.getContext('2d') : null;
  if (ctx) {
    const EDGE = 'rgba(74, 224, 231, 0.42)';
    const DOT = 'rgba(139, 247, 239, 0.72)';
    let width = 0;
    let height = 0;
    let rafId = 0;
    let last = 0;
    let inView = false;
    const bubbles = Array.from({ length: 28 }, (_, index) => ({
      x: ((index * 0.61803398875) % 1),
      y: ((index * 0.38196601125 + 0.13) % 1),
      radius: 1.2 + ((index * 7) % 10) / 4,
      speed: 0.012 + ((index * 11) % 9) / 1000,
      phase: index * 1.7,
    }));

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      if (!r.width || !r.height) return;
      width = r.width;
      height = r.height;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    // Cube and octahedron wireframes
    const makeCube = (size) => {
      const s = size / 2;
      return {
        vertices: [
          [-s, -s, -s], [s, -s, -s], [s, s, -s], [-s, s, -s],
          [-s, -s, s],  [s, -s, s],  [s, s, s],  [-s, s, s],
        ],
        edges: [
          [0, 1], [1, 2], [2, 3], [3, 0],
          [4, 5], [5, 6], [6, 7], [7, 4],
          [0, 4], [1, 5], [2, 6], [3, 7],
        ],
      };
    };

    const makeOctahedron = (size) => {
      const s = size;
      return {
        vertices: [
          [s, 0, 0], [-s, 0, 0],
          [0, s, 0], [0, -s, 0],
          [0, 0, s], [0, 0, -s],
        ],
        edges: [
          [0, 2], [0, 3], [0, 4], [0, 5],
          [1, 2], [1, 3], [1, 4], [1, 5],
          [2, 4], [4, 3], [3, 5], [5, 2],
        ],
      };
    };

    // Positions are fractions of the canvas; spin rates are radians per 60 Hz frame.
    const solids = [
      { geom: makeCube(70), x: -0.32, y: -0.22, z: 200, rx: 0.2, ry: 0.3, rz: 0.1, vx: 0.004, vy: 0.005, vz: 0.003 },
      { geom: makeOctahedron(55), x: 0.36, y: -0.18, z: 240, rx: 0.5, ry: 0.2, rz: 0.4, vx: -0.005, vy: 0.004, vz: 0.002 },
      { geom: makeCube(45), x: -0.38, y: 0.25, z: 280, rx: 0.8, ry: 0.6, rz: 0.2, vx: 0.003, vy: -0.004, vz: 0.003 },
      { geom: makeOctahedron(48), x: 0.35, y: 0.32, z: 260, rx: 0.3, ry: 0.9, rz: 0.5, vx: -0.003, vy: 0.005, vz: -0.004 },
    ];

    const rotatePoint = (p, rx, ry, rz) => {
      const [x, y, z] = p;
      let cos = Math.cos(rx);
      let sin = Math.sin(rx);
      const y1 = y * cos - z * sin;
      const z1 = y * sin + z * cos;
      cos = Math.cos(ry);
      sin = Math.sin(ry);
      const x2 = x * cos + z1 * sin;
      const z2 = -x * sin + z1 * cos;
      cos = Math.cos(rz);
      sin = Math.sin(rz);
      return [x2 * cos - y1 * sin, x2 * sin + y1 * cos, z2];
    };

    const shouldRun = () => inView && !document.hidden && !reduced.matches;

    const draw = (now) => {
      rafId = 0;
      if (!shouldRun() || !width) return;

      const dt = Math.min((now - last) / 16.67 || 1, 3);
      last = now;
      const time = now / 1000;
      ctx.clearRect(0, 0, width, height);

      const glow = ctx.createRadialGradient(width * 0.5, height * 0.45, 0, width * 0.5, height * 0.45, width * 0.58);
      glow.addColorStop(0, 'rgba(38, 207, 220, 0.11)');
      glow.addColorStop(1, 'rgba(38, 207, 220, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);

      bubbles.forEach((bubble) => {
        const x = bubble.x * width + Math.sin(time * 0.35 + bubble.phase) * 10;
        const y = ((bubble.y - time * bubble.speed) % 1 + 1) % 1 * height;
        ctx.beginPath();
        ctx.arc(x, y, bubble.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(171, 250, 244, 0.16)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(171, 250, 244, 0.5)';
        ctx.lineWidth = 0.8;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x - bubble.radius * 0.3, y - bubble.radius * 0.3, Math.max(0.5, bubble.radius * 0.16), 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.fill();
      });

      const fov = 450;
      const cx = width / 2;
      const cy = height * 0.45;
      const count = width < 600 ? 2 : solids.length; // keep phones calm

      for (let n = 0; n < count; n += 1) {
        const item = solids[n];
        item.rx += item.vx * dt;
        item.ry += item.vy * dt;
        item.rz += item.vz * dt;

        const posX = cx + item.x * width;
        const posY = cy + item.y * height;

        const proj = item.geom.vertices.map((v) => {
          const r = rotatePoint(v, item.rx, item.ry, item.rz);
          const scale = fov / (fov + r[2] + item.z);
          return [posX + r[0] * scale, posY + r[1] * scale, scale];
        });

        ctx.strokeStyle = EDGE;
        ctx.lineWidth = 1.2;
        ctx.shadowColor = 'rgba(66, 229, 232, 0.4)';
        ctx.shadowBlur = 9;
        ctx.beginPath();
        item.geom.edges.forEach(([i, j]) => {
          ctx.moveTo(proj[i][0], proj[i][1]);
          ctx.lineTo(proj[j][0], proj[j][1]);
        });
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.fillStyle = DOT;
        proj.forEach(([px, py, scale]) => {
          ctx.beginPath();
          ctx.arc(px, py, 2 * scale, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      rafId = requestAnimationFrame(draw);
    };

    // One place decides whether the loop should be running: hero on screen,
    // tab visible, motion allowed. Anything that changes those calls this.
    const sync = () => {
      if (shouldRun()) {
        if (!rafId) {
          last = performance.now();
          rafId = requestAnimationFrame(draw);
        }
      } else if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = 0;
      }
    };

    const onResize = () => {
      resize();
      sync(); // restarts the loop if it stopped because the canvas had no size yet
    };

    resize();

    if ('ResizeObserver' in window) {
      new ResizeObserver(onResize).observe(canvas);
    } else {
      window.addEventListener('resize', onResize, { passive: true });
    }

    if ('IntersectionObserver' in window) {
      new IntersectionObserver((entries) => {
        inView = entries[entries.length - 1].isIntersecting;
        sync();
      }).observe(canvas);
    } else {
      inView = true;
    }

    document.addEventListener('visibilitychange', sync);

    onReducedMotionChange(() => {
      if (reduced.matches) ctx.clearRect(0, 0, width, height);
      sync();
    });
    sync();
  }

  const handleReducedMotionChange = () => {
    reducedMotionHandlers.forEach((handler) => handler());
  };
  if (typeof reduced.addEventListener === 'function') {
    reduced.addEventListener('change', handleReducedMotionChange);
  } else if (typeof reduced.addListener === 'function') {
    reduced.addListener(handleReducedMotionChange);
  }
})();
