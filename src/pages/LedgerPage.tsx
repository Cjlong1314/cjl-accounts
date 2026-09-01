import { useEffect, useMemo, useState } from 'react'
import { errorMessage, formatMoney, todayIso } from '../lib/format'
import { useAsync } from '../lib/useAsync'
import { EmptyState, PageStatus, Panel } from '../components/ui'
import type { TxType } from '../../shared/types'

const PAGE_SIZE = 10

interface LedgerPageProps {
  onEdit: (id: number) => void
}

export function LedgerPage({ onEdit }: LedgerPageProps) {
  const now = new Date()
  const defaultStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  const [start, setStart] = useState(defaultStart)
  const [end, setEnd] = useState(todayIso())
  const [type, setType] = useState<TxType | 'all'>('all')
  const [categoryId, setCategoryId] = useState<number | 'all'>('all')
  const [page, setPage] = useState(1)

  const categoriesQuery = useAsync(() => window.api.categories.list(), [])
  const filter = useMemo(
    () => ({ start, end, type, category_id: categoryId }),
    [start, end, type, categoryId],
  )
  const txQuery = useAsync(() => window.api.transactions.list(filter), [filter])

  useEffect(() => {
    setPage(1)
  }, [filter])

  const rows = txQuery.data ?? []
  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const pagedRows = rows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const visibleCategories = (categoriesQuery.data ?? []).filter((item) => type === 'all' || item.kind === type)

  async function remove(id: number) {
    if (!window.confirm('确定删除这条流水？')) return
    try {
      await window.api.transactions.delete(id)
      await txQuery.reload()
      const remaining = rows.length - 1
      const nextCount = Math.max(1, Math.ceil(remaining / PAGE_SIZE))
      if (currentPage > nextCount) setPage(nextCount)
    } catch (error) {
      window.alert(errorMessage(error))
    }
  }

  const totalIncome = rows.reduce((sum, tx) => (tx.type === 'income' ? sum + tx.amount : sum), 0)
  const totalExpense = rows.reduce((sum, tx) => (tx.type === 'expense' ? sum + tx.amount : sum), 0)

  return (
    <div className="page-stack">
      <Panel title="筛选">
        <div className="filter-bar">
          <label>
            开始
            <input type="date" value={start} onChange={(event) => setStart(event.target.value)} />
          </label>
          <label>
            结束
            <input type="date" value={end} onChange={(event) => setEnd(event.target.value)} />
          </label>
          <label>
            类型
            <select value={type} onChange={(event) => setType(event.target.value as TxType | 'all')}>
              <option value="all">全部</option>
              <option value="expense">支出</option>
              <option value="income">收入</option>
            </select>
          </label>
          <label>
            分类
            <select
              value={categoryId}
              onChange={(event) =>
                setCategoryId(event.target.value === 'all' ? 'all' : Number(event.target.value))
              }
            >
              <option value="all">全部</option>
              {visibleCategories.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </Panel>

      <Panel
        title="流水明细"
        action={
          <span className="filter-summary">
            收入 {formatMoney(totalIncome)} · 支出 {formatMoney(totalExpense)}
          </span>
        }
      >
        <PageStatus loading={txQuery.loading} error={txQuery.error}>
          {rows.length === 0 ? (
            <EmptyState text="没有符合条件的流水" />
          ) : (
            <>
              <table className="ledger-table">
                <thead>
                  <tr>
                    <th>日期</th>
                    <th>分类</th>
                    <th>备注</th>
                    <th className="num">金额</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {pagedRows.map((tx) => (
                    <tr key={tx.id}>
                      <td>{tx.occurred_at}</td>
                      <td>
                        {tx.category_icon} {tx.category_name}
                      </td>
                      <td className="note">{tx.note || '—'}</td>
                      <td className={tx.type === 'income' ? 'num amount income' : 'num amount expense'}>
                        {tx.type === 'income' ? '+' : '-'}
                        {formatMoney(tx.amount)}
                      </td>
                      <td className="actions">
                        <button type="button" className="text-btn" onClick={() => onEdit(tx.id)}>
                          编辑
                        </button>
                        <button type="button" className="text-btn danger" onClick={() => void remove(tx.id)}>
                          删除
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="pager">
                <span>
                  共 {rows.length} 条，第 {currentPage} / {pageCount} 页
                </span>
                <div className="pager-actions">
                  <button
                    type="button"
                    className="ghost-btn compact"
                    disabled={currentPage <= 1}
                    onClick={() => setPage(currentPage - 1)}
                  >
                    上一页
                  </button>
                  <button
                    type="button"
                    className="ghost-btn compact"
                    disabled={currentPage >= pageCount}
                    onClick={() => setPage(currentPage + 1)}
                  >
                    下一页
                  </button>
                </div>
              </div>
            </>
          )}
        </PageStatus>
      </Panel>
    </div>
  )
}
