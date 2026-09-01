import { useAsync } from '../lib/useAsync'
import { formatMoney, monthLabel } from '../lib/format'
import { EmptyState, PageStatus, Panel, StatCard } from '../components/ui'
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

const PIE_COLORS = ['#1f7a63', '#3aa88a', '#7bc4ae', '#c46b4a', '#d7a15c', '#6b8ea1', '#8a7bb8', '#b07a8a']

interface OverviewPageProps {
  onRecord: () => void
  onEdit: (id: number) => void
}

export function OverviewPage({ onRecord, onEdit }: OverviewPageProps) {
  const { data, loading, error } = useAsync(() => window.api.stats.overview(), [])

  return (
    <PageStatus loading={loading} error={error}>
      {data ? (
        <div className="page-stack">
          <div className="stat-grid">
            <StatCard label="本月收入" value={data.monthIncome} tone="income" />
            <StatCard label="本月支出" value={data.monthExpense} tone="expense" />
            <StatCard label="本月结余" value={data.monthBalance} />
            <StatCard label="账户合计" value={data.totalBalance} hint="含各账户初始余额" />
          </div>

          <div className="split-grid">
            <Panel title="近 6 个月收支">
              {data.last6Months.every((item) => item.income === 0 && item.expense === 0) ? (
                <EmptyState text="还没有足够的记账数据" />
              ) : (
                <div className="chart-box">
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={data.last6Months}>
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
              )}
            </Panel>

            <Panel title="本月支出分类">
              {data.categoryBreakdown.length === 0 ? (
                <EmptyState text="本月还没有支出" />
              ) : (
                <div className="chart-box pie-layout">
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={data.categoryBreakdown}
                        dataKey="amount"
                        nameKey="name"
                        innerRadius={52}
                        outerRadius={84}
                        paddingAngle={2}
                      >
                        {data.categoryBreakdown.map((item, index) => (
                          <Cell key={item.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatMoney(Number(value))} />
                    </PieChart>
                  </ResponsiveContainer>
                  <ul className="legend-list">
                    {data.categoryBreakdown.map((item, index) => (
                      <li key={item.name}>
                        <span className="dot" style={{ background: PIE_COLORS[index % PIE_COLORS.length] }} />
                        {item.icon} {item.name}
                        <strong>{formatMoney(item.amount)}</strong>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Panel>
          </div>

          <div className="split-grid">
            <Panel
              title="最近流水"
              action={
                <button type="button" className="text-btn" onClick={onRecord}>
                  记一笔
                </button>
              }
            >
              {data.recent.length === 0 ? (
                <EmptyState text="还没有流水，先记一笔吧" />
              ) : (
                <ul className="tx-list">
                  {data.recent.map((tx) => (
                    <li key={tx.id}>
                      <button type="button" className="tx-row" onClick={() => onEdit(tx.id)}>
                        <span className="tx-icon">{tx.category_icon}</span>
                        <span className="tx-main">
                          <strong>{tx.category_name}</strong>
                          <small>
                            {tx.occurred_at} · {tx.account_name}
                            {tx.note ? ` · ${tx.note}` : ''}
                          </small>
                        </span>
                        <span className={tx.type === 'income' ? 'amount income' : 'amount expense'}>
                          {tx.type === 'income' ? '+' : '-'}
                          {formatMoney(tx.amount).replace('¥', '¥')}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            <Panel title="账户余额">
              <ul className="account-balances">
                {data.accounts.map((account) => (
                  <li key={account.id}>
                    <span>{account.name}</span>
                    <strong>{formatMoney(account.balance)}</strong>
                  </li>
                ))}
              </ul>
            </Panel>
          </div>
        </div>
      ) : null}
    </PageStatus>
  )
}
