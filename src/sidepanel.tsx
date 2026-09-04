import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { extensionAdapter } from './adapters/extension'
import './styles/panel.css'
import { Panel } from './ui/Panel'

const root = document.getElementById('root')
if (!root) throw new Error('Missing #root element')

createRoot(root).render(
  <StrictMode>
    <Panel adapter={extensionAdapter} compact />
  </StrictMode>,
)
