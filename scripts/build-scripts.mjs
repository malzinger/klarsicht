/**
 * Builds the two classic (non-module) scripts the extension injects or runs
 * outside the React app, and copies the axe-core engine next to them:
 *   public/agent.js       runs inside the inspected page (scan, highlight)
 *   public/background.js  MV3 service worker
 *   public/axe.min.js     accessibility engine
 * They land in public/ so Vite ships them unchanged in dev and in dist/.
 */
import { copyFile, mkdir } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { build } from 'vite'

const require = createRequire(import.meta.url)
const scripts = [
  { entry: 'src/agent/agent.ts', name: 'KlarsichtAgent', file: 'agent' },
  { entry: 'src/background.ts', name: 'KlarsichtBackground', file: 'background' },
]

await mkdir('public', { recursive: true })
for (const { entry, name, file } of scripts) {
  await build({
    configFile: false,
    publicDir: false,
    logLevel: 'warn',
    build: {
      outDir: 'public',
      emptyOutDir: false,
      target: 'es2022',
      minify: true,
      lib: { entry, name, formats: ['iife'], fileName: () => `${file}.js` },
    },
  })
  console.log(`built public/${file}.js`)
}
await copyFile(require.resolve('axe-core/axe.min.js'), 'public/axe.min.js')
console.log('copied public/axe.min.js')
