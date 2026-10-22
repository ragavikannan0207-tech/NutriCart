import { useMemo } from 'react';
import { useAppDataValue } from './AppDataContext';
import { useAuth } from './AuthContext';
import { computeNutritionTargets, budgetSummary } from '@/domain/nutrition';
import { priceCart } from '@/domain/pricing';
import { buildRecommendationGroups } from '@/domain/recommendations';
import { getProductById } from '@/data/products';

/** Raw application data + actions. */
export const useAppData = useAppDataValue;

export function useProfiles() {
  const { profiles, activeProfile } = useAppDataValue();
  return { profiles, activeProfile };
}

export function useActiveProfile() {
  return useAppDataValue().activeProfile;
}

export function useCart() {
  const { cart, pricedCart, cartCount, addToCart, setCartQuantity, removeFromCart, clearCart, addManyToCart } = useAppDataValue();
  return { cart, ...pricedCart, cartCount, addToCart, setCartQuantity, removeFromCart, clearCart, addManyToCart };
}

export function useWishlist() {
  const { wishlist, wishlistIds, toggleWishlist, addWishlistToCart } = useAppDataValue();
  return {
    wishlist,
    wishlistIds,
    toggleWishlist,
    addWishlistToCart,
    isWishlisted: (productId: number) => wishlistIds.has(productId),
  };
}

export function useOrders() {
  const { orders, currentOrder, placeOrder, cancelOrder, reorder } = useAppDataValue();
  return { orders, currentOrder, placeOrder, cancelOrder, reorder };
}

export function usePantry() {
  const { pantryItems, createPantryItem, updatePantryItem, deletePantryItem, adjustPantryItem, addProductsToPantry } =
    useAppDataValue();
  return { pantryItems, createPantryItem, updatePantryItem, deletePantryItem, adjustPantryItem, addProductsToPantry };
}

export function useMealPlan() {
  const { mealPlan, weekStart, addMeal, updateMeal, removeMeal, loadMealPlanWeek } = useAppDataValue();
  return { mealPlan, weekStart, addMeal, updateMeal, removeMeal, loadMealPlanWeek };
}

export function useBudget() {
  const { budget, saveBudget } = useAppDataValue();
  return { budget, saveBudget };
}

export function useNotifications() {
  const { notifications, unreadCount, markNotificationRead, markAllNotificationsRead, removeNotification, pushNotification } =
    useAppDataValue();
  return {
    notifications,
    unreadCount,
    markNotificationRead,
    markAllNotificationsRead,
    removeNotification,
    pushNotification,
  };
}

export function usePreferences() {
  const { preferences, savePreferences } = useAppDataValue();
  return { preferences, savePreferences };
}

export function useAddresses() {
  const { addresses, defaultAddress, createAddress, updateAddress, deleteAddress, setDefaultAddress } = useAppDataValue();
  return { addresses, defaultAddress, createAddress, updateAddress, deleteAddress, setDefaultAddress };
}

/** Daily nutrition targets for the active person. */
export function useNutritionTargets() {
  const activeProfile = useActiveProfile();
  return useMemo(() => (activeProfile ? computeNutritionTargets(activeProfile) : null), [activeProfile]);
}

/** Personalised For You buckets built from real activity. */
export function useRecommendations() {
  const { orders, pantryItems, wishlist, budget } = useAppDataValue();
  const activeProfile = useActiveProfile();
  const summary = useMemo(() => (budget ? budgetSummary(orders, budget, budget.period) : null), [budget, orders]);
  return useMemo(
    () => buildRecommendationGroups({ profile: activeProfile, orders, pantryItems, wishlistItems: wishlist, budget: summary }),
    [activeProfile, orders, pantryItems, wishlist, summary],
  );
}

/** Budget summary for the active person, always derived from real orders. */
export function useBudgetSummary() {
  const { orders, budget } = useAppDataValue();
  return useMemo(() => (budget ? budgetSummary(orders, budget, budget.period) : null), [orders, budget]);
}

/** Cart totals recomputed from a set of explicit lines (used by Checkout preview). */
export function usePricedLines(lines: Array<{ productId: number; quantity: number; unitPrice: number; addedAt: string }>) {
  return useMemo(() => priceCart(lines, getProductById), [lines]);
}

export function useSessionUser() {
  return useAuth().user;
}
