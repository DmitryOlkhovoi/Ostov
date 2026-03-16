import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';

export default [
  // Full bundle (readable)
  {
    input: 'src/backbone.ts',
    output: {
      file: 'dist/backbone.js',
      format: 'es',
      sourcemap: true
    },
    plugins: [
      typescript({ tsconfig: './tsconfig.json', declaration: true, declarationDir: './dist' })
    ]
  },
  // Minified bundle
  {
    input: 'src/backbone.ts',
    output: {
      file: 'dist/backbone.min.js',
      format: 'es',
      sourcemap: true
    },
    plugins: [
      typescript({ tsconfig: './tsconfig.json', declaration: false }),
      terser()
    ]
  }
];
