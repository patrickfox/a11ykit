import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';

const production = !process.env.ROLLUP_WATCH;
const debugBuild = process.env.DEBUG_BUILD === 'true';

export default [
  // ES Module build
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/a11ykit.esm.js',
      format: 'es',
      sourcemap: true
    },
    plugins: [
      resolve({ 
        browser: true,
        preferBuiltins: false 
      }),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: true,
        declarationDir: 'dist/types',
        target: 'es2018',
        module: 'esnext'
      }),
      production && !debugBuild && terser()
    ].filter(Boolean)
  },
  // UMD build for browsers
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/a11ykit.umd.js',
      format: 'umd',
      name: 'A11yKit',
      sourcemap: true
    },
    plugins: [
      resolve({ 
        browser: true,
        preferBuiltins: false 
      }),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        target: 'es5',
        module: 'ESNext'
      }),
      production && !debugBuild && terser()
    ].filter(Boolean)
  },
  // Minified UMD build
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/a11ykit.umd.min.js',
      format: 'umd',
      name: 'A11yKit',
      sourcemap: true
    },
    plugins: [
      resolve({ 
        browser: true,
        preferBuiltins: false 
      }),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        target: 'es5',
        module: 'ESNext'
      }),
      terser()
    ]
  }
];