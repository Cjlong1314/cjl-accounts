import { FormEvent, useEffect, useState } from 'react'
import type { Account, AccountType, Category, CategoryKind } from '../../shared/types'
import { accountTypeLabels, errorMessage, formatMoney } from '../lib/format'
import { useAsync } from '../lib/useAsync'
import { EmptyState, PageStatus, Panel } from '../components/ui'

export function SettingsPage() {
  const categoriesQuery = useAsync(() => window.api.categories.list(), [])
  const accountsQuery = useAsync(() => window.api.accounts.list(), [])
  const [kind, setKind] = useState<CategoryKind>('expense')
  const [dataDir, setDataDir] = useState('')

  useEffect(() => {
    void window.api.meta.dataDir().then(setDataDir)
  }, [])

  const categories = (categoriesQuery.data ?? []).filter((item) => item.kind === kind)

  return (
    <div className="page-stack">
      <p className="data-path">
        账本文件目录：<code>{dataDir || '加载中…'}</code>
        <span>账户、分类、流水分别保存在 accounts.md、categories.md、transactions.md</span>
      </p>
      <div className="split-grid">
        <Panel
          title="分类"
          action={
            <div className="mini-switch">
              <button type="button" className={kind === 'expense' ? 'active' : ''} onClick={() => setKind('expense')}>
                支出
              </button>
              <button type="button" className={kind === 'income' ? 'active' : ''} onClick={() => setKind('income')}>
                收入
              </button>
            </div>
          }
        >
          <PageStatus loading={categoriesQuery.loading} error={categoriesQuery.error}>
            <CategoryEditor
              kind={kind}
              categories={categories}
              onChanged={() => void categoriesQuery.reload()}
            />
          </PageStatus>
        </Panel>

        <Panel title="账户">
          <PageStatus loading={accountsQuery.loading} error={accountsQuery.error}>
            <AccountEditor accounts={accountsQuery.data ?? []} onChanged={() => void accountsQuery.reload()} />
          </PageStatus>
        </Panel>
      </div>
    </div>
  )
}

function CategoryEditor({
  kind,
  categories,
  onChanged,
}: {
  kind: CategoryKind
  categories: Category[]
  onChanged: () => void
}) {
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('')
  const [editing, setEditing] = useState<Category | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  async function save(event: FormEvent) {
    event.preventDefault()
    setMessage(null)
    try {
      if (editing) {
        await window.api.categories.update({ ...editing, name, icon: icon || '记' })
      } else {
        await window.api.categories.create({ name, kind, icon: icon || '记' })
      }
      setName('')
      setIcon('')
      setEditing(null)
      onChanged()
    } catch (error) {
      setMessage(errorMessage(error))
    }
  }

  async function remove(id: number) {
    if (!window.confirm('确定删除该分类？')) return
    try {
      await window.api.categories.delete(id)
      onChanged()
    } catch (error) {
      setMessage(errorMessage(error))
    }
  }

  return (
    <>
      {categories.length === 0 ? <EmptyState text="还没有分类" /> : null}
      <ul className="manage-list">
        {categories.map((item) => (
          <li key={item.id}>
            <span className="tx-icon">{item.icon}</span>
            <strong>{item.name}</strong>
            <button
              type="button"
              className="text-btn"
              onClick={() => {
                setEditing(item)
                setName(item.name)
                setIcon(item.icon)
              }}
            >
              编辑
            </button>
            <button type="button" className="text-btn danger" onClick={() => void remove(item.id)}>
              删除
            </button>
          </li>
        ))}
      </ul>
      <form className="inline-form" onSubmit={save}>
        <input placeholder="分类名" value={name} onChange={(event) => setName(event.target.value)} required />
        <input placeholder="图标字" maxLength={2} value={icon} onChange={(event) => setIcon(event.target.value)} />
        <button type="submit" className="primary-btn compact">
          {editing ? '保存' : '新增'}
        </button>
        {editing ? (
          <button
            type="button"
            className="ghost-btn compact"
            onClick={() => {
              setEditing(null)
              setName('')
              setIcon('')
            }}
          >
            取消
          </button>
        ) : null}
      </form>
      {message ? <p className="form-message">{message}</p> : null}
    </>
  )
}

function AccountEditor({ accounts, onChanged }: { accounts: Account[]; onChanged: () => void }) {
  const [name, setName] = useState('')
  const [type, setType] = useState<AccountType>('cash')
  const [initialBalance, setInitialBalance] = useState('0')
  const [editing, setEditing] = useState<Account | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  async function save(event: FormEvent) {
    event.preventDefault()
    const parsed = Number.parseFloat(initialBalance || '0')
    if (!Number.isFinite(parsed)) {
      setMessage('初始余额格式不正确')
      return
    }
    setMessage(null)
    try {
      if (editing) {
        await window.api.accounts.update({ ...editing, name, type, initial_balance: parsed })
      } else {
        await window.api.accounts.create({ name, type, initial_balance: parsed })
      }
      setName('')
      setType('cash')
      setInitialBalance('0')
      setEditing(null)
      onChanged()
    } catch (error) {
      setMessage(errorMessage(error))
    }
  }

  async function remove(id: number) {
    if (!window.confirm('确定删除该账户？')) return
    try {
      await window.api.accounts.delete(id)
      onChanged()
    } catch (error) {
      setMessage(errorMessage(error))
    }
  }

  return (
    <>
      <ul className="manage-list">
        {accounts.map((item) => (
          <li key={item.id}>
            <span className="tx-icon">{accountTypeLabels[item.type].slice(0, 1)}</span>
            <strong>
              {item.name}
              <small>初始 {formatMoney(item.initial_balance)}</small>
            </strong>
            <button
              type="button"
              className="text-btn"
              onClick={() => {
                setEditing(item)
                setName(item.name)
                setType(item.type)
                setInitialBalance(String(item.initial_balance))
              }}
            >
              编辑
            </button>
            <button type="button" className="text-btn danger" onClick={() => void remove(item.id)}>
              删除
            </button>
          </li>
        ))}
      </ul>
      <form className="inline-form" onSubmit={save}>
        <input placeholder="账户名" value={name} onChange={(event) => setName(event.target.value)} required />
        <select value={type} onChange={(event) => setType(event.target.value as AccountType)}>
          {Object.entries(accountTypeLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <input
          placeholder="初始余额"
          value={initialBalance}
          onChange={(event) => setInitialBalance(event.target.value)}
        />
        <button type="submit" className="primary-btn compact">
          {editing ? '保存' : '新增'}
        </button>
        {editing ? (
          <button
            type="button"
            className="ghost-btn compact"
            onClick={() => {
              setEditing(null)
              setName('')
              setType('cash')
              setInitialBalance('0')
            }}
          >
            取消
          </button>
        ) : null}
      </form>
      {message ? <p className="form-message">{message}</p> : null}
    </>
  )
}
