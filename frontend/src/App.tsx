import { Suspense, lazy, type ReactNode } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { FullPageSpinner } from '@/components/layout/FullPageSpinner';
import { useAuth } from '@/state/AuthContext';
import { useAppData } from '@/state/hooks';

/* Every route is lazy loaded so the first paint stays fast. */
const LoginPage = lazy(() => import('@/pages/auth/LoginPage').then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage').then((m) => ({ default: m.RegisterPage })));
const ProfileSetupPage = lazy(() => import('@/pages/auth/ProfileSetupPage').then((m) => ({ default: m.ProfileSetupPage })));
const OverviewPage = lazy(() => import('@/pages/OverviewPage').then((m) => ({ default: m.OverviewPage })));
const ShopPage = lazy(() => import('@/pages/shop/ShopPage').then((m) => ({ default: m.ShopPage })));
const ProductDetailsPage = lazy(() => import('@/pages/shop/ProductDetailsPage').then((m) => ({ default: m.ProductDetailsPage })));
const WishlistPage = lazy(() => import('@/pages/shop/WishlistPage').then((m) => ({ default: m.WishlistPage })));
const CartPage = lazy(() => import('@/pages/shop/CartPage').then((m) => ({ default: m.CartPage })));
const CheckoutPage = lazy(() => import('@/pages/shop/CheckoutPage').then((m) => ({ default: m.CheckoutPage })));
const OrdersPage = lazy(() => import('@/pages/account/OrdersPage').then((m) => ({ default: m.OrdersPage })));
const OrderDetailsPage = lazy(() => import('@/pages/account/OrderDetailsPage').then((m) => ({ default: m.OrderDetailsPage })));
const OrderConfirmationPage = lazy(() => import('@/pages/account/OrderConfirmationPage').then((m) => ({ default: m.OrderConfirmationPage })));
const InvoicePage = lazy(() => import('@/pages/account/InvoicePage').then((m) => ({ default: m.InvoicePage })));
const PantryPage = lazy(() => import('@/pages/PantryPage').then((m) => ({ default: m.PantryPage })));
const RecipesPage = lazy(() => import('@/pages/RecipesPage').then((m) => ({ default: m.RecipesPage })));
const RecipeDetailsPage = lazy(() => import('@/pages/RecipeDetailsPage').then((m) => ({ default: m.RecipeDetailsPage })));
const MealPlannerPage = lazy(() => import('@/pages/MealPlannerPage').then((m) => ({ default: m.MealPlannerPage })));
const SmartGroceryPage = lazy(() => import('@/pages/SmartGroceryPage').then((m) => ({ default: m.SmartGroceryPage })));
const ForYouPage = lazy(() => import('@/pages/ForYouPage').then((m) => ({ default: m.ForYouPage })));
const PurchasedNutritionPage = lazy(() => import('@/pages/PurchasedNutritionPage').then((m) => ({ default: m.PurchasedNutritionPage })));
const BudgetPage = lazy(() => import('@/pages/BudgetPage').then((m) => ({ default: m.BudgetPage })));
const HealthyAlternativesPage = lazy(() => import('@/pages/HealthyAlternativesPage').then((m) => ({ default: m.HealthyAlternativesPage })));
const NotificationsPage = lazy(() => import('@/pages/NotificationsPage').then((m) => ({ default: m.NotificationsPage })));
const HelpPage = lazy(() => import('@/pages/HelpPage').then((m) => ({ default: m.HelpPage })));
const DietPlansPage = lazy(() => import('@/pages/DietPlansPage').then((m) => ({ default: m.DietPlansPage })));
const SettingsPage = lazy(() => import('@/pages/SettingsPage').then((m) => ({ default: m.SettingsPage })));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })));

/** The first screen of NutriCart is always Login — never a public homepage. */
function RequireAuth({ children }: { children: ReactNode }) {
  const { status, user } = useAuth();
  const { needsProfileSetup, ready } = useAppData();
  const location = useLocation();

  if (status === 'booting') return <FullPageSpinner label="Starting NutriCart…" />;
  if (status !== 'authenticated' || !user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (!ready) return <FullPageSpinner label="Loading your NutriCart…" />;
  if (needsProfileSetup && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }
  return <AppShell>{children}</AppShell>;
}

function PublicOnly({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const { needsProfileSetup, ready } = useAppData();
  if (status === 'booting') return <FullPageSpinner label="Starting NutriCart…" />;
  if (status === 'authenticated') {
    if (!ready) return <FullPageSpinner label="Loading your NutriCart…" />;
    return <Navigate to={needsProfileSetup ? '/onboarding' : '/overview'} replace />;
  }
  return <>{children}</>;
}

export function App() {
  return (
    <Suspense fallback={<FullPageSpinner label="Loading…" />}>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<PublicOnly><LoginPage /></PublicOnly>} />
        <Route path="/register" element={<PublicOnly><RegisterPage /></PublicOnly>} />
        <Route path="/onboarding" element={<RequireAuth><ProfileSetupPage /></RequireAuth>} />

        <Route path="/overview" element={<RequireAuth><OverviewPage /></RequireAuth>} />
        <Route path="/shop" element={<RequireAuth><ShopPage /></RequireAuth>} />
        <Route path="/shop/product/:productId" element={<RequireAuth><ProductDetailsPage /></RequireAuth>} />
        <Route path="/wishlist" element={<RequireAuth><WishlistPage /></RequireAuth>} />
        <Route path="/cart" element={<RequireAuth><CartPage /></RequireAuth>} />
        <Route path="/checkout" element={<RequireAuth><CheckoutPage /></RequireAuth>} />

        <Route path="/order-confirmation/:orderId" element={<RequireAuth><OrderConfirmationPage /></RequireAuth>} />
        <Route path="/orders" element={<RequireAuth><OrdersPage /></RequireAuth>} />
        <Route path="/orders/:orderId" element={<RequireAuth><OrderDetailsPage /></RequireAuth>} />
        <Route path="/orders/:orderId/invoice" element={<RequireAuth><InvoicePage /></RequireAuth>} />

        <Route path="/pantry" element={<RequireAuth><PantryPage /></RequireAuth>} />
        <Route path="/recipes" element={<RequireAuth><RecipesPage /></RequireAuth>} />
        <Route path="/recipes/:recipeId" element={<RequireAuth><RecipeDetailsPage /></RequireAuth>} />
        <Route path="/meal-planner" element={<RequireAuth><MealPlannerPage /></RequireAuth>} />
        <Route path="/smart-grocery" element={<RequireAuth><SmartGroceryPage /></RequireAuth>} />
        <Route path="/for-you" element={<RequireAuth><ForYouPage /></RequireAuth>} />
        <Route path="/purchased-nutrition" element={<RequireAuth><PurchasedNutritionPage /></RequireAuth>} />
        <Route path="/budget" element={<RequireAuth><BudgetPage /></RequireAuth>} />
        <Route path="/healthy-alternatives" element={<RequireAuth><HealthyAlternativesPage /></RequireAuth>} />

        <Route path="/notifications" element={<RequireAuth><NotificationsPage /></RequireAuth>} />
        <Route path="/help" element={<RequireAuth><HelpPage /></RequireAuth>} />
        <Route path="/diet-plans" element={<RequireAuth><DietPlansPage /></RequireAuth>} />
        <Route path="/settings" element={<RequireAuth><SettingsPage /></RequireAuth>} />

        <Route path="*" element={<RequireAuth><NotFoundPage /></RequireAuth>} />
      </Routes>
    </Suspense>
  );
}
