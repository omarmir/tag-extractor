import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'library/src/index.ts',
    benchmark: 'library/src/benchmark.ts',
    'worker-runtime': 'library/src/worker-runtime.ts',
  },
  clean: true,
  dts: true,
  format: ['esm'],
  outDir: 'library/dist',
  sourcemap: true,
  target: 'es2022',
})
