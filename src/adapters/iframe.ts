import type { HighlightTarget, PageAgent, ScanOptions, ScanResult } from '../shared/types'
import type { PageAdapter } from './types'

type AgentWindow = Window & { __klarsicht?: PageAgent }

function loadScript(doc: Document, src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = doc.createElement('script')
    script.src = src
    script.onload = () => resolve()
    script.onerror = () => reject(new Error(`Could not load ${src}`))
    doc.head.appendChild(script)
  })
}

/** Resolves once the frame shows its real document, not the initial about:blank. */
function frameReady(frame: HTMLIFrameElement): Promise<void> {
  const doc = frame.contentDocument
  if (doc && doc.readyState === 'complete' && doc.location.href !== 'about:blank') {
    return Promise.resolve()
  }
  return new Promise((resolve) => frame.addEventListener('load', () => resolve(), { once: true }))
}

/**
 * Drives a same-origin iframe (the live demo on the landing page) with the
 * very same agent script the extension injects into real tabs.
 */
export function createIframeAdapter(getFrame: () => HTMLIFrameElement | null): PageAdapter {
  const frameWindow = (): AgentWindow => {
    const win = getFrame()?.contentWindow
    if (!win) throw new Error('no-tab')
    return win as AgentWindow
  }

  const agent = async (): Promise<PageAgent> => {
    const frame = getFrame()
    if (!frame) throw new Error('no-tab')
    await frameReady(frame)
    const win = frameWindow()
    if (!win.__klarsicht) {
      for (const file of ['axe.min.js', 'agent.js']) {
        await loadScript(win.document, new URL(file, document.baseURI).href)
      }
    }
    if (!win.__klarsicht) throw new Error('generic')
    return win.__klarsicht
  }

  return {
    kind: 'demo',
    async getTarget() {
      const frame = getFrame()
      if (!frame) throw new Error('no-tab')
      await frameReady(frame)
      const win = frameWindow()
      return { title: win.document.title, url: win.location.href }
    },
    async scan(options: ScanOptions): Promise<ScanResult> {
      return (await agent()).scan(options)
    },
    async highlight(targets: HighlightTarget[]) {
      ;(await agent()).highlight(targets)
    },
    async clear() {
      const win = getFrame()?.contentWindow as AgentWindow | null | undefined
      win?.__klarsicht?.clear()
    },
  }
}
