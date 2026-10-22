import {
  BadgeIndianRupee,
  Bell,
  BookOpen,
  ChefHat,
  Compass,
  HelpCircle,
  Heart,
  LayoutDashboard,
  type LucideIcon,
  Package,
  Receipt,
  Repeat,
  Settings,
  ShoppingBasket,
  Sparkles,
  TrendingUp,
  CalendarRange,
} from 'lucide-react';

/**
 * The single navigation definition used by both the desktop sidebar and the
 * mobile slide-out, so every item is always reachable on every screen size.
 */
export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  description?: string;
  group: 'main' | 'other';
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/overview', label: 'Overview', icon: LayoutDashboard, description: 'Your grocery home', group: 'main' },
  { to: '/shop', label: 'Shop Groceries', icon: ShoppingBasket, description: 'Browse the catalogue', group: 'main' },
  { to: '/smart-grocery', label: 'Smart Grocery', icon: Sparkles, description: 'Budget aware basket', group: 'main' },
  { to: '/pantry', label: 'My Pantry', icon: Package, description: 'What is in the kitchen', group: 'main' },
  { to: '/for-you', label: 'For You', icon: Compass, description: 'Personalised picks', group: 'main' },
  { to: '/recipes', label: 'Recipes', icon: ChefHat, description: 'Cook from your stock', group: 'main' },
  { to: '/meal-planner', label: 'Meal Planner', icon: CalendarRange, description: 'Plan the week', group: 'main' },
  { to: '/purchased-nutrition', label: 'Purchased Nutrition', icon: TrendingUp, description: 'Nutrition you bought', group: 'main' },
  { to: '/budget', label: 'Budget', icon: BadgeIndianRupee, description: 'Spending vs budget', group: 'main' },
  { to: '/healthy-alternatives', label: 'Healthy Alternatives', icon: Repeat, description: 'Better swaps', group: 'main' },
  { to: '/orders', label: 'Orders', icon: Receipt, description: 'History and tracking', group: 'other' },
  { to: '/notifications', label: 'Notifications', icon: Bell, description: 'Real order and pantry alerts', group: 'other' },
  { to: '/help', label: 'Help Center', icon: HelpCircle, description: 'FAQs and support', group: 'other' },
  { to: '/settings', label: 'Settings', icon: Settings, description: 'Preferences', group: 'other' },
  { to: '/wishlist', label: 'Wishlist', icon: Heart, description: 'Saved groceries', group: 'other' },
  { to: '/diet-plans', label: 'Diet & Workout Plans', icon: BookOpen, description: 'Personal coaching service', group: 'other' },
];

export const MAIN_NAV = NAV_ITEMS.filter((item) => item.group === 'main');
export const OTHER_NAV = NAV_ITEMS.filter((item) => item.group === 'other');
