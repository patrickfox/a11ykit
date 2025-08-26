let prefersReducedMotion;

const mql = window.matchMedia(`(prefers-reduced-motion: reduce)`);

function prmTest(e) {
  const prm = e === true || e.matches === true;
  let dbc = document.body.classList;
  if (prm) {
    dbc.add('prm');
  } else {
    dbc.remove('prm');
  }
  prefersReducedMotion = prm;
}

mql.addEventListener("change", prmTest);

prmTest(mql);

export {prefersReducedMotion};
