/// <reference types="vitest/config" />
import preact from '@preact/preset-vite'
import { defineConfig } from 'vite'
import pkg from './package.json' with { type: 'json' }

export default defineConfig({
  // relative paths, so that the build works under any GitHub Pages sub-path
  base: './',
  plugins: [preact()],
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  // the learning page imports ../docs/astronomy.md
  server: { fs: { allow: ['..'] } },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    // a fixed time zone for the tests of local time
    env: { TZ: 'Europe/Prague' },
  },
})
