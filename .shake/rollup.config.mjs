import terser from '@rollup/plugin-terser';
const e=['announce','access','ariaHide','prefersReducedMotion','watchReducedMotion','all'];
export default e.map(n=>({input:`.shake/entry-${n}.js`,output:{file:`.shake/out/${n}.js`,format:'es'},plugins:[terser()]}));
