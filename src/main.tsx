import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

async function boot(): Promise<void> {
  if (typeof window.api === 'undefined') {
    const { createWebApi } = await import('./lib/webApi')
    window.api = await createWebApi()
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

void boot()

