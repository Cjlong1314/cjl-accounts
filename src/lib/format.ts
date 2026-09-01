export function formatMoney(value: number): string {
  const sign = value < 0 ? '-' : ''
  const abs = Math.abs(value).toFixed(2)
  const [int, dec] = abs.split('.')
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return `${sign}¥${grouped}.${dec}`
}

export function todayIso(): string {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

export function currentMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export function monthLabel(month: string): string {
  const [year, m] = month.split('-')
  return `${year}年${Number.parseInt(m, 10)}月`
}

export function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return String(error)
}
