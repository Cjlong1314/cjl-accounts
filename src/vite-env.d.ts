/// <reference types="vite/client" />

import type { DesktopApi } from '../shared/api'

declare module '*.md?raw' {
  const content: string
  export default content
}

declare global {
  interface Window {
    api: DesktopApi
  }
}

export {}
