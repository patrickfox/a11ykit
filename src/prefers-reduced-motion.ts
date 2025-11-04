let _prefersReducedMotion: boolean = false;
let _initialized: boolean = false;

function setBodyClass(matches: boolean): void {
  document.body.classList.toggle('prm', matches);
}

function updatePRM(e: MediaQueryListEvent): void {
  _prefersReducedMotion = e.matches;
  setBodyClass(_prefersReducedMotion);
}

function prefersReducedMotion(): boolean {
  if (!_initialized) {
    _initialized = true;

    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    _prefersReducedMotion = mql.matches;

    mql.addEventListener('change', updatePRM);

    setBodyClass(_prefersReducedMotion);
  }

  return _prefersReducedMotion;
}

export { prefersReducedMotion };
