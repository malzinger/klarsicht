import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

/**
 * One build serves two targets: the Chrome extension (side panel) and the
 * landing page with the live demo (GitHub Pages). Relative asset URLs make
 * the same output work from chrome-extension:// and from a sub path.
 */
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    target: 'es2022',
    sourcemap: false,
    rollupOptions: {
      input: {
        index: 'index.html',
        sidepanel: 'sidepanel.html',
      },
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
