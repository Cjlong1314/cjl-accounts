import type {
  Category,
  MonthlyStats,
  OverviewStats,
  RangeStats,
  StatsRange,
  Transaction,
  TransactionFilter,
  TransactionInput,
  TransactionView,
} from './types'

export interface DesktopApi {
  categories: {
    list(): Promise<Category[]>
    create(input: Omit<Category, 'id'>): Promise<Category>
    update(category: Category): Promise<Category>
    delete(id: number): Promise<void>
  }
  transactions: {
    list(filter?: TransactionFilter): Promise<TransactionView[]>
    get(id: number): Promise<TransactionView | null>
    create(input: TransactionInput): Promise<Transaction>
    update(id: number, input: TransactionInput): Promise<Transaction>
    delete(id: number): Promise<void>
  }
  stats: {
    overview(): Promise<OverviewStats>
    monthly(month: string): Promise<MonthlyStats>
    range(range: StatsRange): Promise<RangeStats>
  }
  meta: {
    dataDir(): Promise<string>
  }
}
