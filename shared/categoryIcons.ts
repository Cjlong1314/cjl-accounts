export const DEFAULT_CATEGORY_ICON = 'ellipsis'

export const CATEGORY_ICON_IDS = [
  'utensils-crossed',
  'bus',
  'car-front',
  'shopping-bag',
  'house',
  'gamepad-2',
  'clapperboard',
  'heart-pulse',
  'graduation-cap',
  'book-open',
  'package',
  'smartphone',
  'fuel',
  'plane',
  'ellipsis',
  'wallet',
  'banknote',
  'trophy',
  'gift',
  'trending-up',
  'coins',
] as const

export type CategoryIconId = (typeof CATEGORY_ICON_IDS)[number]

const ICON_SET = new Set<string>(CATEGORY_ICON_IDS)

const ICON_ALIASES: Record<string, CategoryIconId> = {
  餐: 'utensils-crossed',
  行: 'bus',
  购: 'shopping-bag',
  住: 'house',
  乐: 'gamepad-2',
  医: 'heart-pulse',
  学: 'graduation-cap',
  用: 'package',
  其: 'ellipsis',
  薪: 'wallet',
  奖: 'trophy',
  利: 'trending-up',
  红: 'gift',
  入: 'coins',
  记: 'ellipsis',
}

export function normalizeCategoryIcon(icon: string): CategoryIconId {
  const key = icon.trim()
  if (ICON_ALIASES[key]) return ICON_ALIASES[key]
  if (ICON_SET.has(key)) return key as CategoryIconId
  return DEFAULT_CATEGORY_ICON
}
