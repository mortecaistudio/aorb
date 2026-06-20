import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import SpatialApp from './SpatialApp.jsx'
import './spatial.css'

createRoot(document.getElementById('spatial-root')).render(
  <StrictMode>
    <SpatialApp />
  </StrictMode>,
)
