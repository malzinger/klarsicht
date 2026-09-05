import { createIframeAdapter } from '../adapters/iframe'
import { Panel } from './Panel'

const REPO = 'https://github.com/malzinger/klarsicht'
const ZIP = `${REPO}/releases/latest/download/klarsicht-extension.zip`
const SNIPPET =
  '- uses: malzinger/klarsicht@v1\n  with:\n    url: https://preview.example.com\n    threshold: 90'

const FEATURES = [
  [
    'In-place highlights',
    'Every affected element gets a labelled outline right on the page. No guessing which button the report means.',
  ],
  [
    'Fixes, not lectures',
    'Concrete code for the common rules, including a contrast fix that computes the nearest colour that passes while keeping the hue.',
  ],
  [
    'Standards profiles',
    'WCAG 2.2 AA, WCAG 2.1 AA for BFSG / EN 301 549, or everything plus axe best practices.',
  ],
  [
    'Reports',
    'Self-contained HTML report, JSON for your pipeline, or a summary for the ticket. Rule texts in English or German.',
  ],
  [
    'Privacy by design',
    'Uses the activeTab permission by default, host access only if you grant it, runs entirely in your browser and never sends a byte anywhere.',
  ],
  [
    'CI gate',
    'The same scan runs headless in GitHub Actions: it comments score and top fixes on every pull request and fails the build below your threshold.',
  ],
  [
    'Open source',
    'MIT licensed. Engine: axe-core, the same rules Lighthouse uses. UI, fixes, scoring and reports are Klarsicht.',
  ],
] as const

const STEPS = [
  ['Download', 'Grab klarsicht-extension.zip from the latest release and unpack it.'],
  [
    'Enable developer mode',
    'Open chrome://extensions and switch on Developer mode in the top right.',
  ],
  [
    'Load unpacked',
    'Click Load unpacked and pick the unpacked folder. Klarsicht appears in the toolbar.',
  ],
  ['Scan', 'Open any page, click the Klarsicht icon to open the side panel, then Scan this page.'],
] as const

/** Module-level on purpose: the adapter looks the frame up lazily, so no ref is read during render. */
const adapter = createIframeAdapter(
  () => document.getElementById('demo-frame') as HTMLIFrameElement | null,
)

/** ?autoscan=1 runs the demo without a click, handy for shared links and screenshots. */
const autoScan = new URLSearchParams(window.location.search).has('autoscan')

export function Landing() {
  return (
    <div className="site">
      <header className="site__header">
        <a className="brand" href="#top">
          <span className="brand__mark" aria-hidden="true">
            K
          </span>
          <strong>Klarsicht</strong>
        </a>
        <nav className="site__nav" aria-label="Site">
          <a href="#demo">Demo</a>
          <a href="#install">Install</a>
          <a href="#ci">CI</a>
          <a href="#how">How it works</a>
          <a href={REPO} target="_blank" rel="noreferrer">
            GitHub ↗
          </a>
        </nav>
      </header>

      <main id="top">
        <section className="hero">
          <p className="eyebrow">Open-source Chrome extension · WCAG 2.2 · BFSG / EN 301 549</p>
          <h1>See what your users can&apos;t.</h1>
          <p className="lead">
            Klarsicht scans any page against WCAG 2.2, highlights every issue right on the page and
            tells you how to fix it, down to the exact colour value that passes. Nothing leaves your
            browser.
          </p>
          <div className="hero__actions">
            <a className="btn btn--primary" href="#demo">
              Try the live demo
            </a>
            <a className="btn" href={ZIP}>
              Download for Chrome
            </a>
          </div>
        </section>

        <section className="demo" id="demo" aria-labelledby="demo-title">
          <div className="section__intro">
            <h2 id="demo-title">Live demo</h2>
            <p>
              The page below is a deliberately broken demo shop. Press{' '}
              <strong>Scan this page</strong>, open a finding and hit <strong>Show on page</strong>.
              This is the same agent the extension injects into real tabs, running against a
              same-origin iframe.
            </p>
          </div>
          <div className="demo__stage">
            <iframe
              id="demo-frame"
              className="demo__frame"
              src="./demo/sample.html"
              title="Demo shop with accessibility issues"
            />
            <div className="demo__panel">
              <Panel adapter={adapter} autoScan={autoScan} />
            </div>
          </div>
        </section>

        <section className="features" aria-labelledby="features-title">
          <h2 id="features-title">What you get</h2>
          <ul className="feature-grid">
            {FEATURES.map(([title, text]) => (
              <li key={title} className="feature">
                <h3>{title}</h3>
                <p>{text}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="install" id="install" aria-labelledby="install-title">
          <h2 id="install-title">Install in a minute</h2>
          <ol className="steps">
            {STEPS.map(([title, text], index) => (
              <li key={title} className="step">
                <span className="step__num" aria-hidden="true">
                  {index + 1}
                </span>
                <div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              </li>
            ))}
          </ol>
          <p className="note">
            Chrome 116 or newer, also works in Edge and Brave. A Web Store listing is on the
            roadmap.
          </p>
        </section>

        <section className="ci" id="ci" aria-labelledby="ci-title">
          <h2 id="ci-title">In your pipeline</h2>
          <p className="section__intro">
            One step in a workflow scans a preview URL or a locally served build, posts the score
            with the top fixes as a pull-request comment and fails the job below the threshold. The
            CLI behind it works on its own too:{' '}
            <code>npx klarsicht https://example.com --threshold 90</code>.
          </p>
          <pre className="snippet-block">
            <code>{SNIPPET}</code>
          </pre>
        </section>

        <section className="how" id="how" aria-labelledby="how-title">
          <h2 id="how-title">How it works</h2>
          <div className="how__grid">
            <div>
              <h3>Architecture</h3>
              <p>
                The side panel is a small React app. It never touches the page itself: a page
                adapter injects a classic script, the agent, with chrome.scripting and talks to it
                through structured messages. The landing page swaps that adapter for one that drives
                a same-origin iframe, so the demo and the extension share every line of scanning,
                highlighting and reporting code.
              </p>
            </div>
            <div>
              <h3>Scoring</h3>
              <p>
                The score starts at 100. Every failing rule costs its impact weight (critical 10,
                serious 5, moderate 2, minor 1) multiplied by 1 + log2 of the affected elements, so
                a rule broken on eight elements hurts more than on one, but not eight times as much.
                A is 95 and up, B 80, C 60.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="site__footer">
        <span>MIT License · Friedrich Malz</span>
        <span>Engine: axe-core · UI, fixes, scoring and reports by Klarsicht</span>
      </footer>
    </div>
  )
}
