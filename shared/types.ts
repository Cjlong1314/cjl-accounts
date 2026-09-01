export type TxType = 'expense' | 'income'
export type CategoryKind = 'expense' | 'income'
export type AccountType = 'cash' | 'wechat' | 'alipay' | 'bank'

export interface Account {
  id: number
  name: string
  type: AccountType
  initial_balance: number
}

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
  account_id: number
  occurred_at: string
  note: string
}

export interface TransactionInput {
  type: TxType
  amount: number
  category_id: number
  account_id: number
  occurred_at: string
  note: string
}

export interface TransactionFilter {
  start?: string
  end?: string
  type?: TxType | 'all'
  category_id?: number | 'all'
  account_id?: number | 'all'
}

export interface TransactionView extends Transaction {
  category_name: string
  category_icon: string
  account_name: string
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

export interface AccountBalance {
  id: number
  name: string
  type: AccountType
  balance: number
}

export interface OverviewStats {
  monthIncome: number
  monthExpense: number
  monthBalance: number
  totalBalance: number
  last6Months: MonthPoint[]
  categoryBreakdown: CategorySlice[]
  recent: TransactionView[]
  accounts: AccountBalance[]
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
