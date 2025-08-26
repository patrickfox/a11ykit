let prefersReducedMotion: boolean;

const mql = window.matchMedia('(prefers-reduced-motion: reduce)');

function prmTest(e: MediaQueryListEvent | MediaQueryList | boolean): void {
  const prm = e === true || (typeof e === 'object' && 'matches' in e && e.matches === true);
  const dbc = document.body.classList;
  if (prm) {
    dbc.add('prm');
  } else {
    dbc.remove('prm');
  }
  prefersReducedMotion = prm;
}

mql.addEventListener('change', prmTest);

prmTest(mql);

export { prefersReducedMotion };