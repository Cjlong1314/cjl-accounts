import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { MarkdownStore } from '../electron/markdown-db'
import { retentionCutoffIso } from '../shared/retention'

async function main() {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cjl-accounts-smoke-'))
  fs.copyFileSync(path.join(process.cwd(), 'data', 'categories.md'), path.join(dataDir, 'categories.md'))
  const store = new MarkdownStore(dataDir)

  const today = new Date()
  const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  const created = await store.createTransaction({
    type: 'expense',
    amount: 32.5,
    category_id: 1,
    occurred_at: iso,
    note: '午餐',
  })
  await store.createTransaction({
    type: 'income',
    amount: 8000,
    category_id: 10,
    occurred_at: iso,
    note: '工资入账',
  })
  await store.updateTransaction(created.id, {
    type: 'expense',
    amount: 36,
    category_id: 1,
    occurred_at: iso,
    note: '午餐（加饮料）',
  })

  const overview = await store.getOverview()
  const ledger = await store.listTransactions({ start: iso, end: iso })
  if (ledger.length !== 2) throw new Error(`expected 2 rows, got ${ledger.length}`)
  if (overview.monthIncome !== 8000) throw new Error(`income ${overview.monthIncome}`)
  if (overview.monthExpense !== 36) throw new Error(`expense ${overview.monthExpense}`)

  await store.deleteTransaction(created.id)
  const afterDelete = await store.listTransactions({ start: iso, end: iso })
  if (afterDelete.length !== 1) throw new Error('delete failed')
  if (afterDelete[0].note !== '工资入账') throw new Error('wrong remaining row')

  await store.deleteTransaction(afterDelete[0].id)
  const empty = await store.listTransactions({})
  if (empty.length !== 0) throw new Error('cleanup failed')

  const oldDate = '2020-01-15'
  fs.appendFileSync(
    path.join(dataDir, 'transactions.md'),
    `| 9999 | expense | 1.00 | 1 | ${oldDate} | 过期测试 |\n`,
  )
  const removed = await store.purgeExpiredTransactions()
  if (removed < 1) throw new Error('expected expired rows to be purged')
  const leftover = await store.listTransactions({})
  if (leftover.some((tx) => tx.occurred_at < retentionCutoffIso() || tx.id === 9999)) {
    throw new Error('expired transaction still present')
  }

  try {
    await store.createTransaction({
      type: 'expense',
      amount: 1,
      category_id: 1,
      occurred_at: oldDate,
      note: '应被拒绝',
    })
    throw new Error('old date should be rejected')
  } catch (error) {
    if (!(error instanceof Error) || !error.message.includes('近')) {
      throw error
    }
  }

  fs.rmSync(dataDir, { recursive: true, force: true })
  console.log('markdown store smoke ok')
}

void main()
