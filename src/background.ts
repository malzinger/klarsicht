/**
 * MV3 service worker. The only job: clicking the toolbar icon opens the side
 * panel, which also grants the activeTab permission for the current tab.
 */
const enableSidePanel = () =>
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch((error: unknown) => {
    console.error('Klarsicht: could not configure the side panel', error)
  })

chrome.runtime.onInstalled.addListener(() => {
  void enableSidePanel()
})
void enableSidePanel()
