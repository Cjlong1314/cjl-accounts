import { FormEvent, useEffect, useMemo, useState } from 'react'
import type { Category, TransactionInput, TxType } from '../../shared/types'
import { errorMessage, todayIso } from '../lib/format'
import { useAsync } from '../lib/useAsync'
import { PageStatus } from '../components/ui'

interface RecordPageProps {
  editingId: number | null
  onSaved: () => void
  onCancelEdit: () => void
}

export function RecordPage({ editingId, onSaved, onCancelEdit }: RecordPageProps) {
  const categoriesQuery = useAsync(() => window.api.categories.list(), [])
  const accountsQuery = useAsync(() => window.api.accounts.list(), [])
  const [type, setType] = useState<TxType>('expense')
  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState<number | null>(null)
  const [accountId, setAccountId] = useState<number | null>(null)
  const [occurredAt, setOccurredAt] = useState(todayIso())
  const [note, setNote] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const categories = useMemo(
    () => (categoriesQuery.data ?? []).filter((item) => item.kind === type),
    [categoriesQuery.data, type],
  )

  useEffect(() => {
    if (editingId == null) return
    void window.api.transactions.get(editingId).then((tx) => {
      if (!tx) return
      setType(tx.type)
      setAmount(String(tx.amount))
      setCategoryId(tx.category_id)
      setAccountId(tx.account_id)
      setOccurredAt(tx.occurred_at)
      setNote(tx.note)
    })
  }, [editingId])

  useEffect(() => {
    if (categories.length > 0 && !categories.some((item) => item.id === categoryId)) {
      setCategoryId(categories[0].id)
    }
  }, [categories, categoryId])

  useEffect(() => {
    if (editingId != null) return
    const accounts = accountsQuery.data ?? []
    if (accounts.length > 0 && accountId == null) {
      setAccountId(accounts[0].id)
    }
  }, [accountsQuery.data, accountId, editingId])

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    const parsed = Number.parseFloat(amount)
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setMessage('请输入大于 0 的金额')
      return
    }
    if (categoryId == null || accountId == null) {
      setMessage('请选择分类和账户')
      return
    }
    const payload: TransactionInput = {
      type,
      amount: parsed,
      category_id: categoryId,
      account_id: accountId,
      occurred_at: occurredAt,
      note,
    }
    setSaving(true)
    setMessage(null)
    try {
      if (editingId != null) {
        await window.api.transactions.update(editingId, payload)
      } else {
        await window.api.transactions.create(payload)
      }
      setAmount('')
      setNote('')
      setOccurredAt(todayIso())
      onSaved()
    } catch (error) {
      setMessage(errorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  return (
    <PageStatus
      loading={categoriesQuery.loading || accountsQuery.loading}
      error={categoriesQuery.error ?? accountsQuery.error}
    >
      <form className="record-card" onSubmit={onSubmit}>
        <div className="type-switch">
          <button type="button" className={type === 'expense' ? 'active expense' : ''} onClick={() => setType('expense')}>
            支出
          </button>
          <button type="button" className={type === 'income' ? 'active income' : ''} onClick={() => setType('income')}>
            收入
          </button>
        </div>

        <label className="amount-field">
          <span>金额</span>
          <div className="amount-input">
            <em>¥</em>
            <input
              autoFocus
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
          </div>
        </label>

        <fieldset>
          <legend>分类</legend>
          <div className="chip-grid">
            {categories.map((item: Category) => (
              <button
                key={item.id}
                type="button"
                className={categoryId === item.id ? 'chip active' : 'chip'}
                onClick={() => setCategoryId(item.id)}
              >
                <span>{item.icon}</span>
                {item.name}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="form-row">
          <label>
            账户
            <select value={accountId ?? ''} onChange={(event) => setAccountId(Number(event.target.value))}>
              {(accountsQuery.data ?? []).map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            日期
            <input type="date" value={occurredAt} onChange={(event) => setOccurredAt(event.target.value)} />
          </label>
        </div>

        <label>
          备注
          <input placeholder="可选" value={note} onChange={(event) => setNote(event.target.value)} />
        </label>

        {message ? <p className="form-message">{message}</p> : null}

        <div className="form-actions">
          {editingId != null ? (
            <button type="button" className="ghost-btn" onClick={onCancelEdit}>
              取消编辑
            </button>
          ) : null}
          <button type="submit" className="primary-btn" disabled={saving}>
            {saving ? '保存中…' : editingId != null ? '保存修改' : '记一笔'}
          </button>
        </div>
      </form>
    </PageStatus>
  )
}
