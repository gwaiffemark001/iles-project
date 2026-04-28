import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import ILES from './ILES' // 1. Change the import from App to ILES

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ILES /> {/* 2. Render ILES here instead of App */}
  </StrictMode>,
)