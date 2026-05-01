import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import ILES from './ILES'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ILES />
  </StrictMode>,
)