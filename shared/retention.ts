export const RETENTION_YEARS = 3

function pad2(value: number): string {
  return String(value).padStart(2, '0')
}

export function toIsoDate(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`
}

export function retentionCutoffIso(now = new Date()): string {
  return toIsoDate(new Date(now.getFullYear() - RETENTION_YEARS, now.getMonth(), now.getDate()))
}

export function isWithinRetention(occurredAt: string, now = new Date()): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(occurredAt) && occurredAt >= retentionCutoffIso(now)
}
