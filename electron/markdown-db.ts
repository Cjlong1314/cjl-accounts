import fs from 'node:fs'
import path from 'node:path'
import type {
  Category,
  CategoryKind,
  CategorySlice,
  MonthlyStats,
  MonthPoint,
  OverviewStats,
  Transaction,
  TransactionFilter,
  TransactionInput,
  TransactionView,
  TxType,
} from '../shared/types'
import { isWithinRetention, RETENTION_YEARS, retentionCutoffIso } from '../shared/retention'

type Row = Record<string, string>

const TX_TYPES: TxType[] = ['expense', 'income']
const CATEGORY_KINDS: CategoryKind[] = ['expense', 'income']

function unescapeCell(value: string): string {
  return value.replace(/\\\|/g, '|').replace(/\\n/g, '\n').replace(/\\\\/g, '\\')
}

function escapeCell(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/\|/g, '\\|').replace(/\r?\n/g, '\\n')
}

function splitCells(line: string): string[] {
  const trimmed = line.trim()
  const inner = trimmed.startsWith('|') ? trimmed.slice(1) : trimmed
  const withoutEnd = inner.endsWith('|') ? inner.slice(0, -1) : inner
  return withoutEnd.split('|').map((cell) => unescapeCell(cell.trim()))
}

function isSeparator(line: string): boolean {
  return /^\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)+\|?$/.test(line.trim())
}

function parseMarkdownTable(content: string): { headers: string[]; rows: Row[] } {
  const lines = content.split(/\r?\n/).filter((line) => line.trim().startsWith('|'))
  if (lines.length === 0) return { headers: [], rows: [] }
  const headers = splitCells(lines[0])
  const start = lines[1] && isSeparator(lines[1]) ? 2 : 1
  const rows = lines.slice(start).map((line) => {
    const cells = splitCells(line)
    const row: Row = {}
    headers.forEach((header, index) => {
      row[header] = cells[index] ?? ''
    })
    return row
  })
  return { headers, rows }
}

function serializeMarkdownTable(title: string, headers: string[], rows: Row[]): string {
  const widths = headers.map((header) =>
    Math.max(header.length, 3, ...rows.map((row) => escapeCell(row[header] ?? '').length)),
  )
  const pad = (text: string, index: number) => escapeCell(text).padEnd(widths[index], ' ')
  const headerLine = `| ${headers.map((header, index) => pad(header, index)).join(' | ')} |`
  const sepLine = `| ${widths.map((width) => '-'.repeat(width)).join(' | ')} |`
  const body = rows
    .map((row) => `| ${headers.map((header, index) => pad(row[header] ?? '', index)).join(' | ')} |`)
    .join('\n')
  const table = body ? `${headerLine}\n${sepLine}\n${body}\n` : `${headerLine}\n${sepLine}\n`
  return `# ${title}\n\n${table}`
}

function nextId(rows: { id: number }[]): number {
  return rows.reduce((max, row) => Math.max(max, row.id), 0) + 1
}

function toNumber(value: string): number {
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function pad2(value: number): string {
  return String(value).padStart(2, '0')
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}`
}

function monthStart(year: number, monthIndex: number): string {
  return `${year}-${pad2(monthIndex + 1)}-01`
}

function nextMonthStart(year: number, monthIndex: number): string {
  if (monthIndex >= 11) return `${year + 1}-01-01`
  return `${year}-${pad2(monthIndex + 2)}-01`
}

function inMonth(occurredAt: string, year: number, monthIndex: number): boolean {
  return occurredAt >= monthStart(year, monthIndex) && occurredAt < nextMonthStart(year, monthIndex)
}

function assertTxType(value: string): TxType {
  if (TX_TYPES.includes(value as TxType)) return value as TxType
  return 'expense'
}

function assertCategoryKind(value: string): CategoryKind {
  if (CATEGORY_KINDS.includes(value as CategoryKind)) return value as CategoryKind
  return 'expense'
}

function copyIfMissing(sourceDir: string, targetDir: string): void {
  if (sourceDir === targetDir || !fs.existsSync(sourceDir)) return
  for (const name of ['categories.md', 'transactions.md'] as const) {
    const target = path.join(targetDir, name)
    if (fs.existsSync(target)) continue
    const seed = path.join(sourceDir, name)
    if (fs.existsSync(seed)) fs.copyFileSync(seed, target)
  }
}

export class MarkdownStore {
  private readonly dir: string
  private readonly seedDir: string
  private queue: Promise<void> = Promise.resolve()

  constructor(dir: string, seedDir = dir) {
    this.dir = dir
    this.seedDir = seedDir
    this.ensureFiles()
  }

  get dataDir(): string {
    return this.dir
  }

  private file(name: 'categories' | 'transactions'): string {
    return path.join(this.dir, `${name}.md`)
  }

  private ensureFiles(): void {
    fs.mkdirSync(this.dir, { recursive: true })
    copyIfMissing(this.seedDir, this.dir)
    if (!fs.existsSync(this.file('categories'))) {
      this.writeCategories(defaultCategories())
    }
    if (!fs.existsSync(this.file('transactions'))) {
      this.writeTransactions([])
    }
  }

  private run<T>(fn: () => T): Promise<T> {
    const result = this.queue.then(fn)
    this.queue = result.then(
      () => undefined,
      () => undefined,
    )
    return result
  }

  private readRows(name: 'categories' | 'transactions'): Row[] {
    const content = fs.readFileSync(this.file(name), 'utf8')
    return parseMarkdownTable(content).rows
  }

  private writeAtomic(filePath: string, content: string): void {
    const tmp = `${filePath}.tmp`
    fs.writeFileSync(tmp, content, 'utf8')
    fs.renameSync(tmp, filePath)
  }

  private writeCategories(categories: Category[]): void {
    const rows = categories.map((item) => ({
      id: String(item.id),
      name: item.name,
      kind: item.kind,
      icon: item.icon,
    }))
    this.writeAtomic(this.file('categories'), serializeMarkdownTable('分类', ['id', 'name', 'kind', 'icon'], rows))
  }

  private writeTransactions(transactions: Transaction[]): void {
    const rows = transactions.map((item) => ({
      id: String(item.id),
      type: item.type,
      amount: item.amount.toFixed(2),
      category_id: String(item.category_id),
      occurred_at: item.occurred_at,
      note: item.note,
    }))
    this.writeAtomic(
      this.file('transactions'),
      serializeMarkdownTable('流水', ['id', 'type', 'amount', 'category_id', 'occurred_at', 'note'], rows),
    )
  }

  private loadCategories(): Category[] {
    return this.readRows('categories')
      .filter((row) => Number.isFinite(Number.parseInt(row.id, 10)))
      .map((row) => ({
        id: Number.parseInt(row.id, 10),
        name: row.name,
        kind: assertCategoryKind(row.kind),
        icon: row.icon,
      }))
  }

  private loadTransactions(): Transaction[] {
    return this.readRows('transactions')
      .filter((row) => Number.isFinite(Number.parseInt(row.id, 10)))
      .map((row) => ({
        id: Number.parseInt(row.id, 10),
        type: assertTxType(row.type),
        amount: toNumber(row.amount),
        category_id: Number.parseInt(row.category_id, 10),
        occurred_at: row.occurred_at,
        note: row.note ?? '',
      }))
      .sort((a, b) => {
        if (a.occurred_at === b.occurred_at) return b.id - a.id
        return a.occurred_at < b.occurred_at ? 1 : -1
      })
  }

  private toView(tx: Transaction, categories: Category[]): TransactionView {
    const category = categories.find((item) => item.id === tx.category_id)
    return {
      ...tx,
      category_name: category?.name ?? '未分类',
      category_icon: category?.icon ?? '记',
    }
  }

  listCategories(): Promise<Category[]> {
    return this.run(() => this.loadCategories())
  }

  createCategory(input: Omit<Category, 'id'>): Promise<Category> {
    return this.run(() => {
      const categories = this.loadCategories()
      if (categories.some((item) => item.name === input.name.trim() && item.kind === input.kind)) {
        throw new Error('已存在同名分类')
      }
      const category: Category = {
        id: nextId(categories),
        name: input.name.trim(),
        kind: input.kind,
        icon: input.icon.trim() || '记',
      }
      this.writeCategories([...categories, category])
      return category
    })
  }

  updateCategory(category: Category): Promise<Category> {
    return this.run(() => {
      const categories = this.loadCategories()
      if (
        categories.some(
          (item) => item.name === category.name.trim() && item.kind === category.kind && item.id !== category.id,
        )
      ) {
        throw new Error('已存在同名分类')
      }
      const next = categories.map((item) =>
        item.id === category.id
          ? { ...category, name: category.name.trim(), icon: category.icon.trim() || '记' }
          : item,
      )
      if (!next.some((item) => item.id === category.id)) {
        throw new Error('分类不存在')
      }
      this.writeCategories(next)
      return next.find((item) => item.id === category.id)!
    })
  }

  deleteCategory(id: number): Promise<void> {
    return this.run(() => {
      const used = this.loadTransactions().some((tx) => tx.category_id === id)
      if (used) throw new Error('该分类已有流水，无法删除')
      this.writeCategories(this.loadCategories().filter((item) => item.id !== id))
    })
  }

  listTransactions(filter: TransactionFilter = {}): Promise<TransactionView[]> {
    return this.run(() => {
      const categories = this.loadCategories()
      return this.loadTransactions()
        .filter((tx) => {
          if (filter.start && tx.occurred_at < filter.start) return false
          if (filter.end && tx.occurred_at > filter.end) return false
          if (filter.type && filter.type !== 'all' && tx.type !== filter.type) return false
          if (filter.category_id && filter.category_id !== 'all' && tx.category_id !== filter.category_id) {
            return false
          }
          return true
        })
        .map((tx) => this.toView(tx, categories))
    })
  }

  getTransaction(id: number): Promise<TransactionView | null> {
    return this.run(() => {
      const tx = this.loadTransactions().find((item) => item.id === id)
      if (!tx) return null
      return this.toView(tx, this.loadCategories())
    })
  }

  createTransaction(input: TransactionInput): Promise<Transaction> {
    return this.run(() => this.saveTransaction(undefined, input))
  }

  updateTransaction(id: number, input: TransactionInput): Promise<Transaction> {
    return this.run(() => this.saveTransaction(id, input))
  }

  private saveTransaction(id: number | undefined, input: TransactionInput): Transaction {
    if (!(input.amount > 0)) throw new Error('金额必须大于 0')
    if (!isWithinRetention(input.occurred_at)) {
      throw new Error(`只能记录近 ${RETENTION_YEARS} 年内的收支（${retentionCutoffIso()} 起）`)
    }
    const categories = this.loadCategories()
    const category = categories.find((item) => item.id === input.category_id)
    if (!category) throw new Error('分类不存在')
    if (category.kind !== input.type) throw new Error('分类与收支类型不匹配')
    const transactions = this.loadTransactions()
    const record: Transaction = {
      id: id ?? nextId(transactions),
      type: input.type,
      amount: Math.round(input.amount * 100) / 100,
      category_id: input.category_id,
      occurred_at: input.occurred_at,
      note: input.note.trim(),
    }
    const next = id
      ? transactions.map((item) => (item.id === id ? record : item))
      : [record, ...transactions]
    if (id && !transactions.some((item) => item.id === id)) {
      throw new Error('流水不存在')
    }
    this.writeTransactions(next)
    return record
  }

  deleteTransaction(id: number): Promise<void> {
    return this.run(() => {
      this.writeTransactions(this.loadTransactions().filter((item) => item.id !== id))
    })
  }

  purgeExpiredTransactions(now = new Date()): Promise<number> {
    return this.run(() => {
      const transactions = this.loadTransactions()
      const kept = transactions.filter((tx) => isWithinRetention(tx.occurred_at, now))
      const removed = transactions.length - kept.length
      if (removed > 0) this.writeTransactions(kept)
      return removed
    })
  }

  getOverview(): Promise<OverviewStats> {
    return this.run(() => {
      const now = new Date()
      const year = now.getFullYear()
      const monthIndex = now.getMonth()
      const categories = this.loadCategories()
      const transactions = this.loadTransactions()
      const monthTx = transactions.filter((tx) => inMonth(tx.occurred_at, year, monthIndex))
      const monthIncome = sumBy(monthTx, 'income')
      const monthExpense = sumBy(monthTx, 'expense')
      const last6Months: MonthPoint[] = []
      for (let offset = 5; offset >= 0; offset -= 1) {
        const date = new Date(year, monthIndex - offset, 1)
        const y = date.getFullYear()
        const m = date.getMonth()
        const slice = transactions.filter((tx) => inMonth(tx.occurred_at, y, m))
        last6Months.push({
          month: monthKey(date),
          income: sumBy(slice, 'income'),
          expense: sumBy(slice, 'expense'),
        })
      }
      return {
        monthIncome,
        monthExpense,
        monthBalance: monthIncome - monthExpense,
        totalBalance: sumBy(transactions, 'income') - sumBy(transactions, 'expense'),
        last6Months,
        categoryBreakdown: slices(monthTx, 'expense', categories),
        recent: transactions.slice(0, 8).map((tx) => this.toView(tx, categories)),
      }
    })
  }

  getMonthlyStats(month: string): Promise<MonthlyStats> {
    return this.run(() => {
      const [yearText, monthText] = month.split('-')
      const year = Number.parseInt(yearText, 10)
      const monthIndex = Number.parseInt(monthText, 10) - 1
      const categories = this.loadCategories()
      const transactions = this.loadTransactions()
      const monthTx = transactions.filter((tx) => inMonth(tx.occurred_at, year, monthIndex))
      const income = sumBy(monthTx, 'income')
      const expense = sumBy(monthTx, 'expense')
      const trend: MonthPoint[] = []
      for (let offset = 5; offset >= 0; offset -= 1) {
        const date = new Date(year, monthIndex - offset, 1)
        const slice = transactions.filter((tx) => inMonth(tx.occurred_at, date.getFullYear(), date.getMonth()))
        trend.push({
          month: monthKey(date),
          income: sumBy(slice, 'income'),
          expense: sumBy(slice, 'expense'),
        })
      }
      return {
        month,
        income,
        expense,
        balance: income - expense,
        trend,
        expenseByCategory: slices(monthTx, 'expense', categories),
        incomeByCategory: slices(monthTx, 'income', categories),
      }
    })
  }
}

function sumBy(transactions: Transaction[], type: TxType): number {
  return transactions.reduce((sum, tx) => (tx.type === type ? sum + tx.amount : sum), 0)
}

function slices(transactions: Transaction[], type: TxType, categories: Category[]): CategorySlice[] {
  const grouped = new Map<number, number>()
  for (const tx of transactions) {
    if (tx.type !== type) continue
    grouped.set(tx.category_id, (grouped.get(tx.category_id) ?? 0) + tx.amount)
  }
  return [...grouped.entries()]
    .map(([id, amount]) => {
      const category = categories.find((item) => item.id === id)
      return {
        name: category?.name ?? '未分类',
        icon: category?.icon ?? '记',
        amount,
      }
    })
    .sort((a, b) => b.amount - a.amount)
}

function defaultCategories(): Category[] {
  return [
    { id: 1, name: '餐饮', kind: 'expense', icon: '餐' },
    { id: 2, name: '交通', kind: 'expense', icon: '行' },
    { id: 3, name: '购物', kind: 'expense', icon: '购' },
    { id: 4, name: '居住', kind: 'expense', icon: '住' },
    { id: 5, name: '娱乐', kind: 'expense', icon: '乐' },
    { id: 6, name: '医疗', kind: 'expense', icon: '医' },
    { id: 7, name: '教育', kind: 'expense', icon: '学' },
    { id: 8, name: '日用', kind: 'expense', icon: '用' },
    { id: 9, name: '其他', kind: 'expense', icon: '其' },
    { id: 10, name: '工资', kind: 'income', icon: '薪' },
    { id: 11, name: '奖金', kind: 'income', icon: '奖' },
    { id: 12, name: '理财', kind: 'income', icon: '利' },
    { id: 13, name: '红包', kind: 'income', icon: '红' },
    { id: 14, name: '其他', kind: 'income', icon: '入' },
  ]
}
