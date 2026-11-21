/// <reference types="vitest/config" />
import preact from '@preact/preset-vite'
import { defineConfig } from 'vite'

export default defineConfig({
  // relative paths, so that the build works under any GitHub Pages sub-path
  base: './',
  plugins: [preact()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    // a fixed time zone for the tests of local time
    env: { TZ: 'Europe/Prague' },
  },
})
