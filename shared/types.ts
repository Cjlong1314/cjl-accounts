export type TxType = 'expense' | 'income'
export type CategoryKind = 'expense' | 'income'

export interface Category {
  id: number
  name: string
  kind: CategoryKind
  icon: string
}

export interface Transaction {
  id: number
  type: TxType
  amount: number
  category_id: number
  occurred_at: string
  note: string
}

export interface TransactionInput {
  type: TxType
  amount: number
  category_id: number
  occurred_at: string
  note: string
}

export interface TransactionFilter {
  start?: string
  end?: string
  type?: TxType | 'all'
  category_id?: number | 'all'
}

export interface TransactionView extends Transaction {
  category_name: string
  category_icon: string
}

export interface MonthPoint {
  month: string
  income: number
  expense: number
}

export interface CategorySlice {
  name: string
  icon: string
  amount: number
}

export interface OverviewStats {
  monthIncome: number
  monthExpense: number
  monthBalance: number
  totalBalance: number
  last6Months: MonthPoint[]
  categoryBreakdown: CategorySlice[]
  recent: TransactionView[]
}

export interface MonthlyStats {
  month: string
  income: number
  expense: number
  balance: number
  trend: MonthPoint[]
  expenseByCategory: CategorySlice[]
  incomeByCategory: CategorySlice[]
}
