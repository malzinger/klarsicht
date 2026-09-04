/**
 * Renders the README screenshots with a locally installed Edge or Chrome using
 * the browser's own headless screenshot mode. No extra dependencies.
 *   npm run dev            (one terminal, http://localhost:5173)
 *   npm run screenshot [baseUrl]
 * The demo runs with ?autoscan=1, so the capture shows real findings and highlights.
 */
import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const base = (process.argv[2] ?? 'http://localhost:5173').replace(/\/$/, '')
const candidates = [
  process.env.BROWSER_PATH,
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
].filter(Boolean)
const browser = candidates.find((path) => existsSync(path))
if (!browser) {
  console.error('No Chromium-based browser found. Set BROWSER_PATH.')
  process.exit(1)
}

const shots = [
  { file: 'docs/hero.png', url: `${base}/`, size: '1440,900', budget: 3000 },
  { file: 'docs/demo.png', url: `${base}/?autoscan=1`, size: '1440,1500', budget: 9000 },
]

await mkdir('docs', { recursive: true })
for (const shot of shots) {
  const out = join(process.cwd(), shot.file)
  execFileSync(
    browser,
    [
      '--headless=new',
      '--disable-gpu',
      '--no-first-run',
      '--hide-scrollbars',
      // an explicit profile keeps Edge from handing the launch to a running instance
      `--user-data-dir=${join(tmpdir(), 'klarsicht-screenshots')}`,
      `--window-size=${shot.size}`,
      `--virtual-time-budget=${shot.budget}`,
      `--screenshot=${out}`,
      shot.url,
    ],
    { stdio: 'ignore', timeout: 60000 },
  )
  console.log(`saved ${shot.file}`)
}
