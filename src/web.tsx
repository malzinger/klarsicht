import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/panel.css'
import './styles/site.css'
import { Landing } from './ui/Landing'

const root = document.getElementById('root')
if (!root) throw new Error('Missing #root element')

createRoot(root).render(
  <StrictMode>
    <Landing />
  </StrictMode>,
)
