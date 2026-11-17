if (typeof window !== 'undefined') {
  const root = document.documentElement;
  const toggles = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-theme-toggle]'));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let switching = false;

  function syncThemeToggles() {
    const dark = root.dataset.theme === 'dark';
    toggles.forEach((toggle) => {
      toggle.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
    });
  }

  function applyTheme(next: 'light' | 'dark') {
    root.dataset.theme = next;
    try {
      localStorage.setItem('omoo-theme', next);
    } catch {
      /* Storage can be unavailable in private mode. */
    }
    syncThemeToggles();
  }

  async function switchTheme(toggle: HTMLButtonElement, event: MouseEvent) {
    if (switching) return;

    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    const doc = document as Document & {
      startViewTransition?: (callback: () => void) => { finished: Promise<void> };
    };

    if (!doc.startViewTransition || reduceMotion) {
      applyTheme(next);
      return;
    }

    // A top-layer dialog is not part of the page snapshot. Fade its tokens instead.
    const openDialog = document.querySelector('dialog[open]');
    if (openDialog) {
      switching = true;
      root.classList.add('theme-transition');
      applyTheme(next);
      window.setTimeout(() => {
        root.classList.remove('theme-transition');
        switching = false;
      }, 1150);
      return;
    }

    const rect = toggle.getBoundingClientRect();
    const x = event.clientX || rect.left + rect.width / 2;
    const y = event.clientY || rect.top + rect.height / 2;

    root.style.setProperty('--theme-x', `${x}px`);
    root.style.setProperty('--theme-y', `${y}px`);
    root.classList.add('theme-transition');
    switching = true;

    try {
      const transition = doc.startViewTransition(() => applyTheme(next));
      transition.finished.finally(() => {
        root.classList.remove('theme-transition');
        switching = false;
      });
    } catch {
      root.classList.remove('theme-transition');
      switching = false;
      applyTheme(next);
    }
  }

  syncThemeToggles();

  toggles.forEach((toggle) => {
    toggle.addEventListener('click', (event) => switchTheme(toggle, event));
  });
}
