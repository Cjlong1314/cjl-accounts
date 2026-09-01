import { FormEvent, useEffect, useState } from 'react'
import type { Category, CategoryKind } from '../../shared/types'
import { DEFAULT_CATEGORY_ICON } from '../../shared/categoryIcons'
import { errorMessage } from '../lib/format'
import { CATEGORY_ICON_OPTIONS, CategoryIcon } from '../lib/CategoryIcon'
import { useAsync } from '../lib/useAsync'
import { EmptyState, PageStatus, Panel } from '../components/ui'

export function SettingsPage() {
  const categoriesQuery = useAsync(() => window.api.categories.list(), [])
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
        <span>分类、流水分别保存在 categories.md、transactions.md</span>
      </p>
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
          <CategoryEditor kind={kind} categories={categories} onChanged={() => void categoriesQuery.reload()} />
        </PageStatus>
      </Panel>
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
  const [icon, setIcon] = useState(DEFAULT_CATEGORY_ICON)
  const [editing, setEditing] = useState<Category | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  async function save(event: FormEvent) {
    event.preventDefault()
    setMessage(null)
    try {
      if (editing) {
        await window.api.categories.update({ ...editing, name, icon })
      } else {
        await window.api.categories.create({ name, kind, icon })
      }
      setName('')
      setIcon(DEFAULT_CATEGORY_ICON)
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
            <span className="tx-icon">
              <CategoryIcon icon={item.icon} />
            </span>
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
        <div className="icon-picker" role="listbox" aria-label="分类图标">
          {CATEGORY_ICON_OPTIONS.map((id) => (
            <button
              key={id}
              type="button"
              className={icon === id ? 'icon-pick active' : 'icon-pick'}
              onClick={() => setIcon(id)}
              title={id}
            >
              <CategoryIcon icon={id} size={18} />
            </button>
          ))}
        </div>
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
              setIcon(DEFAULT_CATEGORY_ICON)
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
