import { useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { CategoryIcon } from '../lib/CategoryIcon'
import { currentMonth, formatMoney, monthLabel } from '../lib/format'
import { PIE_COLORS } from '../lib/chartColors'
import { useAsync } from '../lib/useAsync'
import { EmptyState, PageStatus, Panel, StatCard } from '../components/ui'

export function StatsPage() {
  const [month, setMonth] = useState(currentMonth())
  const { data, loading, error } = useAsync(() => window.api.stats.monthly(month), [month])

  return (
    <div className="page-stack">
      <div className="month-picker">
        <label>
          统计月份
          <input type="month" value={month} onChange={(event) => setMonth(event.target.value)} />
        </label>
      </div>

      <PageStatus loading={loading} error={error}>
        {data ? (
          <>
            <div className="stat-grid three">
              <StatCard label={`${monthLabel(month)}收入`} value={data.income} tone="income" />
              <StatCard label={`${monthLabel(month)}支出`} value={data.expense} tone="expense" />
              <StatCard label="结余" value={data.balance} />
            </div>

            <Panel title="近 6 个月趋势">
              <div className="chart-box">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={data.trend}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#dce7e2" />
                    <XAxis dataKey="month" tickFormatter={monthLabel} tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={(value) => formatMoney(Number(value))}
                      labelFormatter={(label) => monthLabel(String(label))}
                    />
                    <Bar dataKey="income" name="收入" fill="#1f7a63" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expense" name="支出" fill="#c46b4a" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Panel>

            <div className="split-grid">
              <Panel title="支出分类">
                <CategoryList items={data.expenseByCategory} empty="本月没有支出" />
              </Panel>
              <Panel title="收入分类">
                <CategoryList items={data.incomeByCategory} empty="本月没有收入" />
              </Panel>
            </div>
          </>
        ) : null}
      </PageStatus>
    </div>
  )
}

function CategoryList({
  items,
  empty,
}: {
  items: { name: string; icon: string; amount: number }[]
  empty: string
}) {
  if (items.length === 0) return <EmptyState text={empty} />
  const total = items.reduce((sum, item) => sum + item.amount, 0)
  return (
    <div className="pie-layout">
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie data={items} dataKey="amount" nameKey="name" innerRadius={46} outerRadius={76} paddingAngle={2}>
            {items.map((item, index) => (
              <Cell key={item.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => formatMoney(Number(value))} />
        </PieChart>
      </ResponsiveContainer>
      <ul className="legend-list">
        {items.map((item, index) => (
          <li key={item.name}>
            <span className="dot" style={{ background: PIE_COLORS[index % PIE_COLORS.length] }} />
            <CategoryIcon icon={item.icon} size={14} /> {item.name}
            <strong>
              {formatMoney(item.amount)} · {total === 0 ? '0%' : `${Math.round((item.amount / total) * 100)}%`}
            </strong>
          </li>
        ))}
      </ul>
    </div>
  )
}
