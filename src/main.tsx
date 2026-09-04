import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Capacitor } from '@capacitor/core'
import App from './App'
import './index.css'

function syncMobileClass(): void {
  const mobile = Capacitor.isNativePlatform() || window.innerWidth <= 900
  document.documentElement.classList.toggle('is-mobile', mobile)
}

async function boot(): Promise<void> {
  syncMobileClass()
  window.addEventListener('resize', syncMobileClass)

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

