import { defineConfig } from 'tsup'
import { version } from './package.json' assert { type: 'json' }

export default defineConfig({
  entry: ['src/index.ts'],
  dts: true,
  clean: true,
  sourcemap: true,
  format: ['esm'],
  env: {
    VERSION: version,
  },
})
