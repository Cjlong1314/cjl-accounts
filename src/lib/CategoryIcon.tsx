import type { LucideIcon } from 'lucide-react'
import {
  Banknote,
  BookOpen,
  Bus,
  CarFront,
  Clapperboard,
  Coins,
  Ellipsis,
  Fuel,
  Gamepad2,
  Gift,
  GraduationCap,
  HeartPulse,
  House,
  Package,
  Plane,
  ShoppingBag,
  Smartphone,
  TrendingUp,
  Trophy,
  UtensilsCrossed,
  Wallet,
} from 'lucide-react'
import { CATEGORY_ICON_IDS, normalizeCategoryIcon, type CategoryIconId } from '../../shared/categoryIcons'

const ICONS: Record<CategoryIconId, LucideIcon> = {
  'utensils-crossed': UtensilsCrossed,
  bus: Bus,
  'car-front': CarFront,
  'shopping-bag': ShoppingBag,
  house: House,
  'gamepad-2': Gamepad2,
  clapperboard: Clapperboard,
  'heart-pulse': HeartPulse,
  'graduation-cap': GraduationCap,
  'book-open': BookOpen,
  package: Package,
  smartphone: Smartphone,
  fuel: Fuel,
  plane: Plane,
  ellipsis: Ellipsis,
  wallet: Wallet,
  banknote: Banknote,
  trophy: Trophy,
  gift: Gift,
  'trending-up': TrendingUp,
  coins: Coins,
}

export const CATEGORY_ICON_OPTIONS = CATEGORY_ICON_IDS

export function CategoryIcon({ icon, size = 18 }: { icon: string; size?: number }) {
  const Icon = ICONS[normalizeCategoryIcon(icon)]
  return <Icon size={size} strokeWidth={2} />
}
