import type { HighlightTarget, ScanOptions, ScanResult } from '../shared/types'
import type { PageAdapter } from './types'

async function activeTab(): Promise<chrome.tabs.Tab & { id: number }> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (!tab || tab.id === undefined) throw new Error('no-tab')
  return tab as chrome.tabs.Tab & { id: number }
}

/** Injects engine + agent once per page; later calls reuse them. */
async function ensureAgent(tabId: number): Promise<void> {
  const [probe] = await chrome.scripting.executeScript({
    target: { tabId },
    func: () => typeof window.__klarsicht !== 'undefined',
  })
  if (probe?.result === true) return
  await chrome.scripting.executeScript({ target: { tabId }, files: ['axe.min.js', 'agent.js'] })
}

/** Turns Chrome's permission errors into the "no-access" code the UI explains. */
async function withAccess<T>(run: () => Promise<T>): Promise<T> {
  try {
    return await run()
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(
      /cannot access|permission|activeTab|no tab with id/i.test(message) ? 'no-access' : message,
      { cause: error },
    )
  }
}

export const extensionAdapter: PageAdapter = {
  kind: 'extension',

  async getTarget() {
    const tab = await activeTab()
    return { title: tab.title ?? '', url: tab.url ?? '' }
  },

  async scan(options: ScanOptions): Promise<ScanResult> {
    const tab = await activeTab()
    if (tab.url && !/^https?:/i.test(tab.url)) throw new Error('unsupported-page')
    return withAccess(async () => {
      await ensureAgent(tab.id)
      const [injection] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (opts: ScanOptions) => window.__klarsicht?.scan(opts),
        args: [options],
      })
      const result = injection?.result
      if (!result) throw new Error('generic')
      return result
    })
  },

  async highlight(targets: HighlightTarget[]) {
    const tab = await activeTab()
    await withAccess(() =>
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (list: HighlightTarget[]) => window.__klarsicht?.highlight(list),
        args: [targets],
      }),
    )
  },

  async clear() {
    const tab = await activeTab()
    await withAccess(() =>
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => window.__klarsicht?.clear(),
      }),
    )
  },
}
