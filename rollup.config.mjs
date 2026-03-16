import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';

export default [
  // Full bundle (readable)
  {
    input: 'src/ostov.ts',
    output: {
      file: 'dist/ostov.js',
      format: 'es',
      sourcemap: true
    },
    plugins: [
      typescript({ tsconfig: './tsconfig.json', declaration: true, declarationDir: './dist' })
    ]
  },
  // Minified bundle
  {
    input: 'src/ostov.ts',
    output: {
      file: 'dist/ostov.min.js',
      format: 'es',
      sourcemap: true
    },
    plugins: [
      typescript({ tsconfig: './tsconfig.json', declaration: false }),
      terser()
    ]
  }
];
