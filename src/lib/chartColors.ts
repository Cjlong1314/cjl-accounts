export const PIE_COLORS = [
  '#0d7a4f',
  '#e36b1a',
  '#2a62d8',
  '#d12f5a',
  '#c9a00c',
  '#6b3cc9',
  '#1494a8',
  '#8a5a2b',
  '#3d7a1f',
  '#b33d9a',
  '#4d6b82',
  '#c44b2b',
]

export function groupSmallSlices<T extends { name: string; icon: string; amount: number }>(
  items: T[],
  maxSlices = 5,
): T[] {
  if (items.length <= maxSlices) return items
  const sorted = [...items].sort((a, b) => b.amount - a.amount)
  const head = sorted.slice(0, maxSlices - 1)
  const rest = sorted.slice(maxSlices - 1)
  const otherAmount = rest.reduce((sum, item) => sum + item.amount, 0)
  return [
    ...head,
    {
      ...(rest[0] as T),
      name: '其他',
      icon: 'ellipsis',
      amount: otherAmount,
    },
  ]
}
