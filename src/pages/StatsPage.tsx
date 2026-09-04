import { useState } from 'react'
import type { RangeStats, StatsRange } from '../../shared/types'
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
import { formatMoney, monthLabel, shortMonthLabel, axisMoney } from '../lib/format'
import { PIE_COLORS, groupSmallSlices } from '../lib/chartColors'
import { useAsync } from '../lib/useAsync'
import { EmptyState, PageStatus, Panel, StatCard } from '../components/ui'

const RANGE_OPTIONS: { value: StatsRange; label: string }[] = [
  { value: 'month', label: '本月度' },
  { value: '3months', label: '近三月' },
  { value: '6months', label: '近六月' },
  { value: 'year', label: '近一年' },
]

export function StatsPage() {
  const [range, setRange] = useState<StatsRange>('month')
  const { data, loading, error } = useAsync(() => window.api.stats.range(range), [range])

  return (
    <div className="page-stack">
      <div className="stats-toolbar">
        <div>
          <p className="toolbar-label">统计范围</p>
          <p className="toolbar-hint">按时间范围查看收入、支出和分类趋势</p>
        </div>
        <div className="range-switch" role="tablist" aria-label="统计范围">
          {RANGE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              role="tab"
              aria-selected={range === option.value}
              className={range === option.value ? 'range-btn active' : 'range-btn'}
              onClick={() => setRange(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <PageStatus loading={loading} error={error}>
        {data ? <StatsContent data={data} /> : null}
      </PageStatus>
    </div>
  )
}

function StatsContent({ data }: { data: RangeStats }) {
  return (
    <>
      <div className="stat-grid three">
        <StatCard label={data.label + '收入'} value={data.income} tone="income" />
        <StatCard label={data.label + '支出'} value={data.expense} tone="expense" />
        <StatCard label="结余" value={data.balance} />
      </div>

      <Panel title={data.label + '趋势'}>
        <div className="chart-box">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.trend} barCategoryGap="22%" barGap={3} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#dce7e2" />
              <XAxis dataKey="month" tickFormatter={shortMonthLabel} tick={{ fontSize: 11 }} interval={0} />
              <YAxis tickFormatter={axisMoney} tick={{ fontSize: 11 }} width={36} />
              <Tooltip
                formatter={(value) => formatMoney(Number(value))}
                labelFormatter={(label) => monthLabel(String(label))}
              />
              <Bar dataKey="income" name="收入" fill="#1f7a63" radius={[4, 4, 0, 0]} maxBarSize={28} />
              <Bar dataKey="expense" name="支出" fill="#c46b4a" radius={[4, 4, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <div className="split-grid">
        <Panel title="支出分类">
          <CategoryList items={data.expenseByCategory} empty={data.label + '没有支出'} />
        </Panel>
        <Panel title="收入分类">
          <CategoryList items={data.incomeByCategory} empty={data.label + '没有收入'} />
        </Panel>
      </div>
    </>
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
  const pieData = groupSmallSlices(items)
  return (
    <div className="pie-layout">
      <div className="chart-box pie-chart">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={pieData} dataKey="amount" nameKey="name" innerRadius="42%" outerRadius="70%" paddingAngle={2}>
              {pieData.map((item, index) => (
                <Cell key={item.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => formatMoney(Number(value))} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="legend-list">
        {pieData.map((item, index) => (
          <li key={item.name}>
            <span className="dot" style={{ background: PIE_COLORS[index % PIE_COLORS.length] }} />
            <span className="legend-name">
              <CategoryIcon icon={item.icon} size={14} />
              {item.name}
            </span>
            <strong>
              {formatMoney(item.amount)} · {total === 0 ? '0%' : Math.round((item.amount / total) * 100) + '%'}
            </strong>
          </li>
        ))}
      </ul>
    </div>
  )
}
