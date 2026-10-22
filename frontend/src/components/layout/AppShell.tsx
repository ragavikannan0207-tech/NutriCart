import { useEffect, useState, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { Bell, Heart, Menu, Search, ShoppingCart, X } from 'lucide-react';
import { useAppData } from '@/state/hooks';
import { useAuth } from '@/state/AuthContext';
import { useScrollLock } from '@/hooks';
import { BrandLogo } from './BrandLogo';
import { ProfileSwitcher } from './ProfileSwitcher';
import { Sidebar } from './Sidebar';

/**
 * ONE reusable application shell. Every authenticated page renders inside this,
 * so the header, cart badge, notifications badge, profile switcher and the
 * navigation behave identically everywhere.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { cartCount, wishlistIds, unreadCount } = useAppData();
  const { mode } = useAuth();
  useScrollLock(drawerOpen);

  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const term = search.trim();
    navigate(term ? `/shop?q=${encodeURIComponent(term)}` : '/shop');
  };

  return (
    <div className="min-h-screen bg-cream-100">
      <header className="sticky top-0 z-40 border-b border-cream-300 bg-cream-50/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] items-center gap-3 px-3 py-2.5 sm:px-5">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-cream-300 bg-white text-ink-600 lg:hidden"
            aria-label="Open navigation"
          >
            <Menu className="h-4 w-4" />
          </button>

          <BrandLogo size="md" className="shrink-0" />

          <form onSubmit={submitSearch} className="relative ml-1 hidden flex-1 md:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search groceries, categories, tags…"
              aria-label="Search groceries"
              className="h-10 w-full rounded-xl border border-cream-300 bg-white pl-9 pr-3 text-sm text-ink-800 shadow-inset transition placeholder:text-ink-500/60 focus:border-forest-500 focus:outline-none focus:ring-2 focus:ring-forest-500/20"
            />
          </form>

          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            {mode === 'local' ? (
              <span
                title="The Spring Boot API was not reachable, so NutriCart is using its on-device data layer."
                className="hidden rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-2xs font-semibold uppercase tracking-wide text-amber-700 sm:block"
              >
                Local mode
              </span>
            ) : null}

            <Link to="/shop" className="flex h-9 w-9 items-center justify-center rounded-xl border border-cream-300 bg-white text-ink-600 transition hover:text-forest-700 md:hidden" aria-label="Search groceries">
              <Search className="h-4 w-4" />
            </Link>

            <HeaderIcon to="/notifications" label="Notifications" badge={unreadCount}>
              <Bell className="h-4 w-4" />
            </HeaderIcon>
            <HeaderIcon to="/wishlist" label="Wishlist" badge={wishlistIds.size}>
              <Heart className="h-4 w-4" />
            </HeaderIcon>
            <HeaderIcon to="/cart" label="Cart" badge={cartCount}>
              <ShoppingCart className="h-4 w-4" />
            </HeaderIcon>

            <ProfileSwitcher />
          </div>
        </div>

        <form onSubmit={submitSearch} className="border-t border-cream-200 px-3 py-2 md:hidden">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search groceries…"
              aria-label="Search groceries"
              className="h-9 w-full rounded-xl border border-cream-300 bg-white pl-9 pr-3 text-sm shadow-inset focus:border-forest-500 focus:outline-none"
            />
          </div>
        </form>
      </header>

      <div className="mx-auto flex max-w-[1600px] gap-5 px-3 py-4 sm:px-5">
        <aside className="sticky top-[4.75rem] hidden h-[calc(100vh-6rem)] w-64 shrink-0 overflow-hidden rounded-2xl border border-cream-300 bg-white shadow-card lg:block">
          <Sidebar />
        </aside>
        <main className="min-w-0 flex-1 pb-10">{children}</main>
      </div>

      {drawerOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink-900/40 backdrop-blur-[2px] animate-fade-in" onClick={() => setDrawerOpen(false)} aria-hidden />
          <div className="absolute inset-y-0 left-0 flex w-[19rem] max-w-[85vw] flex-col border-r border-cream-300 bg-white shadow-lift animate-slide-in-right">
            <div className="flex items-center justify-between gap-3 border-b border-cream-200 px-4 py-3">
              <BrandLogo size="sm" />
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-cream-300 text-ink-600"
                aria-label="Close navigation"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <Sidebar onNavigate={() => setDrawerOpen(false)} />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function HeaderIcon({ to, label, badge, children }: { to: string; label: string; badge?: number; children: ReactNode }) {
  return (
    <Link
      to={to}
      aria-label={label}
      title={label}
      className={clsx(
        'relative flex h-9 w-9 items-center justify-center rounded-xl border border-cream-300 bg-white text-ink-600 transition hover:border-forest-300 hover:text-forest-700',
      )}
    >
      {children}
      {badge && badge > 0 ? (
        <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-forest-700 px-1 text-2xs font-semibold text-cream-50">
          {badge > 99 ? '99+' : badge}
        </span>
      ) : null}
    </Link>
  );
}
