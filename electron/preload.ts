import { contextBridge, ipcRenderer } from 'electron'
import type { DesktopApi } from '../shared/api'

const api: DesktopApi = {
  accounts: {
    list: () => ipcRenderer.invoke('accounts:list'),
    create: (input) => ipcRenderer.invoke('accounts:create', input),
    update: (account) => ipcRenderer.invoke('accounts:update', account),
    delete: (id) => ipcRenderer.invoke('accounts:delete', id),
  },
  categories: {
    list: () => ipcRenderer.invoke('categories:list'),
    create: (input) => ipcRenderer.invoke('categories:create', input),
    update: (category) => ipcRenderer.invoke('categories:update', category),
    delete: (id) => ipcRenderer.invoke('categories:delete', id),
  },
  transactions: {
    list: (filter) => ipcRenderer.invoke('transactions:list', filter ?? {}),
    get: (id) => ipcRenderer.invoke('transactions:get', id),
    create: (input) => ipcRenderer.invoke('transactions:create', input),
    update: (id, input) => ipcRenderer.invoke('transactions:update', id, input),
    delete: (id) => ipcRenderer.invoke('transactions:delete', id),
  },
  stats: {
    overview: () => ipcRenderer.invoke('stats:overview'),
    monthly: (month) => ipcRenderer.invoke('stats:monthly', month),
  },
  meta: {
    dataDir: () => ipcRenderer.invoke('meta:dataDir'),
  },
}

contextBridge.exposeInMainWorld('api', api)
