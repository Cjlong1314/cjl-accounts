import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'node:path'
import fs from 'node:fs'
import { MarkdownStore } from './markdown-db'
import type { Category, TransactionFilter, TransactionInput } from '../shared/types'

process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true'

let mainWindow: BrowserWindow | null = null
let store: MarkdownStore

function resolveDataDir(): { dir: string; seedDir: string } {
  const seedDir = app.isPackaged
    ? path.join(process.resourcesPath, 'data')
    : path.join(process.cwd(), 'data')
  const dir = app.isPackaged ? path.join(app.getPath('userData'), 'data') : seedDir
  if (!fs.existsSync(seedDir)) {
    fs.mkdirSync(seedDir, { recursive: true })
  }
  return { dir, seedDir }
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 960,
    minHeight: 640,
    title: '记账本',
    backgroundColor: '#f3f6f4',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

function wrap<T>(fn: () => Promise<T>): Promise<T> {
  return fn()
}

app.whenReady().then(async () => {
  const { dir, seedDir } = resolveDataDir()
  store = new MarkdownStore(dir, seedDir)
  const removed = await store.purgeExpiredTransactions()
  if (removed > 0) {
    console.log(`[记账本] 已删除 ${removed} 条超过近三年的流水`)
  }

  ipcMain.handle('categories:list', () => wrap(() => store.listCategories()))
  ipcMain.handle('categories:create', (_event, input: Omit<Category, 'id'>) => wrap(() => store.createCategory(input)))
  ipcMain.handle('categories:update', (_event, category: Category) => wrap(() => store.updateCategory(category)))
  ipcMain.handle('categories:delete', (_event, id: number) => wrap(() => store.deleteCategory(id)))

  ipcMain.handle('transactions:list', (_event, filter: TransactionFilter) =>
    wrap(() => store.listTransactions(filter)),
  )
  ipcMain.handle('transactions:get', (_event, id: number) => wrap(() => store.getTransaction(id)))
  ipcMain.handle('transactions:create', (_event, input: TransactionInput) =>
    wrap(() => store.createTransaction(input)),
  )
  ipcMain.handle('transactions:update', (_event, id: number, input: TransactionInput) =>
    wrap(() => store.updateTransaction(id, input)),
  )
  ipcMain.handle('transactions:delete', (_event, id: number) => wrap(() => store.deleteTransaction(id)))

  ipcMain.handle('stats:overview', () => wrap(() => store.getOverview()))
  ipcMain.handle('stats:monthly', (_event, month: string) => wrap(() => store.getMonthlyStats(month)))
  ipcMain.handle('meta:dataDir', () => store.dataDir)

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
