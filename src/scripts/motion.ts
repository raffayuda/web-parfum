import { animate, inView, scroll } from 'motion';

const EASE = [0.16, 1, 0.3, 1] as const;
const browser = typeof window !== 'undefined';
let reduceMotion = false;
let finePointer = false;

function initReveals() {
  if (reduceMotion || !('IntersectionObserver' in window)) return;

  const items = Array.from(
    document.querySelectorAll<HTMLElement>('[data-reveal], [data-reveal-title], [data-reveal-image]')
  );

  items.forEach((item) => {
    if (item.dataset.revealReady === '1') return;
    item.dataset.revealReady = '1';

    const rect = item.getBoundingClientRect();
    const belowFold = rect.top > window.innerHeight * 0.94;
    const image = item.hasAttribute('data-reveal-image');
    const title = item.hasAttribute('data-reveal-title');

    if (!belowFold) return;

    if (image) {
      // Do not clip before observing: Chromium counts clip-path as zero intersection.
      item.style.opacity = '0';
    } else {
      item.style.opacity = '0';
      item.style.transform = title ? 'translateY(34px)' : 'translateY(26px)';
      if (title) item.style.filter = 'blur(4px)';
    }

    inView(
      item,
      () => {
        const delay = Number.parseFloat(item.dataset.delay ?? '0');

        if (image) {
          animate(
            item,
            {
              opacity: [0, 1],
              clipPath: ['inset(0 0 100% 0)', 'inset(0 0 0% 0)'],
            },
            {
              duration: 1.15,
              delay,
              ease: EASE,
              onComplete: () => {
                item.style.opacity = '';
                item.style.clipPath = '';
                item.style.transform = '';
              },
            }
          );
          return;
        }

        animate(
          item,
          {
            opacity: [0, 1],
            y: title ? [34, 0] : [26, 0],
            filter: title ? ['blur(4px)', 'blur(0px)'] : undefined,
          },
          {
            duration: title ? 1 : 0.8,
            delay,
            ease: EASE,
            onComplete: () => {
              item.style.opacity = '';
              item.style.transform = '';
              item.style.filter = '';
            },
          }
        );
      },
      { amount: 0.14 }
    );
  });
}

function applyStaggerGroups() {
  document.querySelectorAll<HTMLElement>('[data-stagger]').forEach((group) => {
    const children = Array.from(group.querySelectorAll<HTMLElement>('[data-reveal]'));
    children.forEach((child, index) => {
      if (!child.dataset.delay) {
        child.dataset.delay = String(Math.min(index * 0.07, 0.35));
      }
    });
  });
}

function initTilt() {
  if (reduceMotion || !finePointer) return;

  document.querySelectorAll<HTMLElement>('[data-tilt]').forEach((card) => {
    if (card.dataset.tiltReady === '1') return;
    card.dataset.tiltReady = '1';

    const target = card.querySelector<HTMLElement>('[data-tilt-media]') ?? card;
    let bounds: DOMRect | null = null;

    const reset = () => {
      bounds = null;
      animate(
        target,
        { rotateX: 0, rotateY: 0, scale: 1 },
        { type: 'spring', stiffness: 160, damping: 20 }
      );
    };

    card.addEventListener('pointerenter', () => {
      bounds = card.getBoundingClientRect();
    });

    card.addEventListener('pointermove', (event) => {
      if (!bounds) bounds = card.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width - 0.5;
      const y = (event.clientY - bounds.top) / bounds.height - 0.5;

      animate(
        target,
        {
          rotateX: `${(-y * 3.2).toFixed(2)}deg`,
          rotateY: `${(x * 3.2).toFixed(2)}deg`,
          scale: 1.015,
        },
        { type: 'spring', stiffness: 170, damping: 22 }
      );
    });

    card.addEventListener('pointerleave', reset);
    card.addEventListener('blur', reset, true);
  });
}

function initMagnetic() {
  if (reduceMotion || !finePointer) return;

  document.querySelectorAll<HTMLElement>('[data-magnetic]').forEach((button) => {
    if (button.dataset.magneticReady === '1') return;
    button.dataset.magneticReady = '1';

    const reset = () =>
      animate(button, { x: 0, y: 0 }, { type: 'spring', stiffness: 220, damping: 18 });

    button.addEventListener('pointermove', (event) => {
      const bounds = button.getBoundingClientRect();
      const x = event.clientX - (bounds.left + bounds.width / 2);
      const y = event.clientY - (bounds.top + bounds.height / 2);
      animate(
        button,
        { x: x * 0.12, y: y * 0.16 },
        { type: 'spring', stiffness: 220, damping: 20 }
      );
    });

    button.addEventListener('pointerleave', reset);
  });
}

function initParallax() {
  if (reduceMotion) return;

  document.querySelectorAll<HTMLElement>('[data-parallax-image]').forEach((image) => {
    if (image.dataset.parallaxReady === '1') return;
    image.dataset.parallaxReady = '1';

    const target = image.closest<HTMLElement>('[data-parallax]') ?? image.parentElement;
    if (!target) return;

    scroll(
      animate(image, { y: [-16, 16] }, { ease: 'linear' }),
      {
        target,
        offset: ['start end', 'end start'],
      }
    );
  });
}

function initMist() {
  if (reduceMotion) return;

  document.querySelectorAll<HTMLElement>('[data-mist]').forEach((blob, index) => {
    animate(
      blob,
      {
        x: [0, 22 + index * 8, 0],
        y: [0, -18 - index * 6, 0],
        scale: [1, 1.06, 1],
      },
      {
        duration: 18 + index * 5,
        repeat: Infinity,
        ease: 'easeInOut',
      }
    );
  });
}

function initScrollProgress() {
  const bar = document.querySelector<HTMLElement>('[data-scroll-progress]');
  if (!bar) return;

  scroll(animate(bar, { scaleX: [0, 1] }, { ease: 'linear' }));
}

function initMenuRevealFloat() {
  if (reduceMotion) return;

  document.querySelectorAll<HTMLElement>('[data-float-loop]').forEach((element, index) => {
    animate(
      element,
      { y: [0, -9, 0] },
      {
        duration: 7 + index * 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
        delay: 1.4,
      }
    );
  });
}

function initScrollLines() {
  if (reduceMotion) return;

  document.querySelectorAll<HTMLElement>('[data-scroll-line]').forEach((line) => {
    const target = line.closest<HTMLElement>('[data-scroll-line-target]') ?? line.parentElement;
    if (!target) return;

    scroll(animate(line, { scaleY: [0, 1] }, { ease: 'linear' }), {
      target,
      offset: ['start 78%', 'end 55%'],
    });
  });
}

function initPageTransitions() {
  if (reduceMotion) return;

  const veil = document.querySelector<HTMLElement>('[data-page-veil]');
  const mark = veil?.querySelector<HTMLElement>('[data-veil-mark]');
  const rule = veil?.querySelector<HTMLElement>('[data-veil-rule]');
  if (!veil) return;

  let leaving = false;

  document.addEventListener('click', (event) => {
    if (event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    const anchor = (event.target as Element | null)?.closest<HTMLAnchorElement>('a[href]');
    if (!anchor) return;
    if (anchor.target && anchor.target !== '_self') return;
    if (anchor.hasAttribute('download')) return;
    if (anchor.dataset.noTransition !== undefined) return;

    const url = new URL(anchor.href, window.location.href);
    if (url.origin !== window.location.origin) return;
    if (url.pathname === window.location.pathname && !url.hash) return;
    if (url.pathname === window.location.pathname && url.hash) return;
    if (url.pathname.endsWith('.pdf')) return;

    event.preventDefault();
    if (leaving) return;
    leaving = true;

    try {
      sessionStorage.setItem('omoo-page-transition', '1');
    } catch {
      /* storage can be unavailable */
    }

    veil.style.visibility = 'visible';
    veil.style.pointerEvents = 'auto';

    window.setTimeout(() => {
      window.location.href = url.href;
    }, 560);

    try {
      animate(veil, { opacity: [0, 1] }, { duration: 0.42, ease: EASE });
      animate(
        veil,
        { clipPath: ['inset(100% 0 0 0)', 'inset(0% 0 0 0)'] },
        { duration: 0.52, ease: EASE }
      );
      if (mark) {
        animate(
          mark,
          { y: ['110%', '0%'], opacity: [0, 1] },
          { duration: 0.55, delay: 0.12, ease: EASE }
        );
      }
      if (rule) {
        animate(rule, { scaleX: [0, 1] }, { duration: 0.5, delay: 0.18, ease: EASE });
      }
    } catch {
      window.location.href = url.href;
    }
  });
}

function init() {
  if (!browser) return;
  reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  applyStaggerGroups();
  initReveals();
  initTilt();
  initMagnetic();
  initParallax();
  initMist();
  initScrollProgress();
  initScrollLines();
  initMenuRevealFloat();
  initPageTransitions();
}

if (browser) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
}
