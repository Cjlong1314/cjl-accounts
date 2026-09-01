import path from 'node:path'
import { MarkdownStore } from '../electron/markdown-db'

async function main() {
  const dataDir = path.join(process.cwd(), 'data')
  const store = new MarkdownStore(dataDir)

  const today = new Date()
  const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  const created = await store.createTransaction({
    type: 'expense',
    amount: 32.5,
    category_id: 1,
    account_id: 2,
    occurred_at: iso,
    note: '午餐',
  })
  await store.createTransaction({
    type: 'income',
    amount: 8000,
    category_id: 10,
    account_id: 4,
    occurred_at: iso,
    note: '工资入账',
  })
  await store.updateTransaction(created.id, {
    type: 'expense',
    amount: 36,
    category_id: 1,
    account_id: 2,
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

  console.log('markdown store smoke ok')
  console.log('data dir', store.dataDir)
}

void main()
