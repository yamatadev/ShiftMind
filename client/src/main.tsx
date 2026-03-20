import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/globals.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <div className="min-h-screen bg-base flex items-center justify-center">
      <h1 className="text-3xl font-heading font-bold text-primary">ShiftMind</h1>
    </div>
  </StrictMode>,
)
