import { Capacitor } from '@capacitor/core'
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem'
import type { DesktopApi } from '../../shared/api'
import { MarkdownStore, type LedgerFileBackend, type LedgerFileName } from '../../shared/markdownStore'

const FILES: LedgerFileName[] = ['categories', 'transactions']
const STORAGE_PREFIX = 'cjl-accounts:'
const ANDROID_CLEAR_FLAG = 'cjl-accounts-android-ledger-cleared'

function asText(data: string | Blob): Promise<string> {
  if (typeof data === 'string') return Promise.resolve(data)
  return data.text()
}

function hasLedgerRows(content: string): boolean {
  return /^\|\s*\d+/m.test(content)
}

function createMemoryBackend(
  dataDir: string,
  initial: Record<LedgerFileName, { content: string; present: boolean }>,
  persist: (name: LedgerFileName, content: string) => Promise<void>,
): LedgerFileBackend {
  const files: Record<LedgerFileName, string> = {
    categories: initial.categories.content,
    transactions: initial.transactions.content,
  }
  const present: Record<LedgerFileName, boolean> = {
    categories: initial.categories.present,
    transactions: initial.transactions.present,
  }
  const dirty = new Set<LedgerFileName>()

  return {
    dataDir,
    ensureReady() {},
    exists(name) {
      return present[name]
    },
    read(name) {
      return files[name]
    },
    write(name, content) {
      files[name] = content
      present[name] = true
      dirty.add(name)
    },
    async flush() {
      if (dirty.size === 0) return
      const names = [...dirty]
      dirty.clear()
      for (const name of names) {
        await persist(name, files[name])
      }
    },
  }
}

async function clearNativeLedgerOnce(): Promise<void> {
  if (window.localStorage.getItem(ANDROID_CLEAR_FLAG) === '1') return
  for (const name of FILES) {
    try {
      await Filesystem.deleteFile({
        path: `${name}.md`,
        directory: Directory.Data,
      })
    } catch {
      // file may not exist
    }
  }
  window.localStorage.setItem(ANDROID_CLEAR_FLAG, '1')
}

async function createCapacitorBackend(): Promise<LedgerFileBackend> {
  await clearNativeLedgerOnce()

  const loaded: Record<LedgerFileName, { content: string; present: boolean }> = {
    categories: { content: '', present: false },
    transactions: { content: '', present: false },
  }

  for (const name of FILES) {
    try {
      const result = await Filesystem.readFile({
        path: `${name}.md`,
        directory: Directory.Data,
        encoding: Encoding.UTF8,
      })
      const content = await asText(result.data)
      loaded[name] = { content, present: hasLedgerRows(content) }
    } catch {
      loaded[name] = { content: '', present: false }
    }
  }

  return createMemoryBackend('应用内部存储', loaded, async (name, content) => {
    await Filesystem.writeFile({
      path: `${name}.md`,
      data: content,
      directory: Directory.Data,
      encoding: Encoding.UTF8,
    })
  })
}

function createLocalStorageBackend(): LedgerFileBackend {
  const loaded: Record<LedgerFileName, { content: string; present: boolean }> = {
    categories: { content: '', present: false },
    transactions: { content: '', present: false },
  }

  for (const name of FILES) {
    const content = window.localStorage.getItem(`${STORAGE_PREFIX}${name}.md`) ?? ''
    loaded[name] = { content, present: hasLedgerRows(content) }
  }

  return createMemoryBackend('浏览器本地存储', loaded, async (name, content) => {
    window.localStorage.setItem(`${STORAGE_PREFIX}${name}.md`, content)
  })
}

export async function createWebApi(): Promise<DesktopApi> {
  const backend = Capacitor.isNativePlatform() ? await createCapacitorBackend() : createLocalStorageBackend()
  const store = new MarkdownStore(backend)
  await store.purgeExpiredTransactions()

  return {
    categories: {
      list: () => store.listCategories(),
      create: (input) => store.createCategory(input),
      update: (category) => store.updateCategory(category),
      delete: (id) => store.deleteCategory(id),
    },
    transactions: {
      list: (filter) => store.listTransactions(filter),
      get: (id) => store.getTransaction(id),
      create: (input) => store.createTransaction(input),
      update: (id, input) => store.updateTransaction(id, input),
      delete: (id) => store.deleteTransaction(id),
    },
    stats: {
      overview: () => store.getOverview(),
      monthly: (month) => store.getMonthlyStats(month),
      range: (range) => store.getRangeStats(range),
    },
    meta: {
      dataDir: async () => store.dataDir,
    },
  }
}
