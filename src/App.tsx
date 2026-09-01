import { useState } from 'react'
import { OverviewPage } from './pages/OverviewPage'
import { RecordPage } from './pages/RecordPage'
import { LedgerPage } from './pages/LedgerPage'
import { StatsPage } from './pages/StatsPage'
import { SettingsPage } from './pages/SettingsPage'

type PageId = 'overview' | 'record' | 'ledger' | 'stats' | 'settings'

const NAV: { id: PageId; label: string; caption: string }[] = [
  { id: 'overview', label: '总览', caption: '本月账目' },
  { id: 'record', label: '记一笔', caption: '快速入账' },
  { id: 'ledger', label: '流水', caption: '明细筛选' },
  { id: 'stats', label: '统计', caption: '分类趋势' },
  { id: 'settings', label: '分类', caption: '账本设置' },
]

export default function App() {
  const [page, setPage] = useState<PageId>('overview')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [refreshToken, setRefreshToken] = useState(0)
  const [toast, setToast] = useState<string | null>(null)

  function showToast(text: string) {
    setToast(text)
    window.setTimeout(() => setToast(null), 2200)
  }

  function goRecord(id?: number) {
    setEditingId(id ?? null)
    setPage('record')
  }

  function afterSave() {
    const wasEdit = editingId != null
    setEditingId(null)
    setRefreshToken((value) => value + 1)
    showToast(wasEdit ? '已保存修改' : '已记一笔')
    if (wasEdit) setPage('ledger')
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">记</span>
          <div>
            <strong>记账本</strong>
            <small>本地 Markdown 账本</small>
          </div>
        </div>
        <nav>
          {NAV.map((item) => (
            <button
              key={item.id}
              type="button"
              className={page === item.id ? 'nav-item active' : 'nav-item'}
              onClick={() => {
                if (item.id !== 'record') setEditingId(null)
                setPage(item.id)
              }}
            >
              <span>{item.label}</span>
              <small>{item.caption}</small>
            </button>
          ))}
        </nav>
        <p className="sidebar-foot">数据保存在项目 data 目录的 md 文件中</p>
      </aside>

      <main className="main-pane">
        <header className="topbar">
          <h1>{NAV.find((item) => item.id === page)?.label}</h1>
          <button type="button" className="primary-btn" onClick={() => goRecord()}>
            记一笔
          </button>
        </header>
        <div className="content">
          {page === 'overview' ? (
            <OverviewPage key={refreshToken} onRecord={() => goRecord()} onEdit={goRecord} />
          ) : null}
          {page === 'record' ? (
            <RecordPage
              key={editingId ?? 'new'}
              editingId={editingId}
              onSaved={afterSave}
              onCancelEdit={() => {
                setEditingId(null)
                setPage('ledger')
              }}
            />
          ) : null}
          {page === 'ledger' ? <LedgerPage key={refreshToken} onEdit={goRecord} /> : null}
          {page === 'stats' ? <StatsPage key={refreshToken} /> : null}
          {page === 'settings' ? <SettingsPage key={refreshToken} /> : null}
        </div>
      </main>

      {toast ? <div className="toast">{toast}</div> : null}
    </div>
  )
}
