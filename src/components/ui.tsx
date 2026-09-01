import type { ReactNode } from 'react'
import { formatMoney } from '../lib/format'

interface StatCardProps {
  label: string
  value: number
  tone?: 'default' | 'income' | 'expense' | 'muted'
  hint?: string
}

export function StatCard({ label, value, tone = 'default', hint }: StatCardProps) {
  return (
    <article className={`stat-card tone-${tone}`}>
      <p className="stat-label">{label}</p>
      <p className="stat-value">{formatMoney(value)}</p>
      {hint ? <p className="stat-hint">{hint}</p> : null}
    </article>
  )
}

export function Panel({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="panel">
      <header className="panel-head">
        <h2>{title}</h2>
        {action}
      </header>
      {children}
    </section>
  )
}

export function EmptyState({ text }: { text: string }) {
  return <p className="empty-state">{text}</p>
}

export function PageStatus({ loading, error, children }: { loading: boolean; error: string | null; children: ReactNode }) {
  if (loading) return <p className="page-status">加载中…</p>
  if (error) return <p className="page-status error">{error}</p>
  return <>{children}</>
}
