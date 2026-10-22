import { NavLink } from 'react-router-dom';
import { clsx } from 'clsx';
import { MAIN_NAV, OTHER_NAV, type NavItem } from './navigation';
import { useAppData } from '@/state/hooks';

function NavRow({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      onClick={onNavigate}
      className={({ isActive }) =>
        clsx(
          'group flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition',
          isActive ? 'bg-forest-700 text-cream-50 shadow-sm' : 'text-ink-600 hover:bg-cream-200 hover:text-forest-800',
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon className={clsx('h-4 w-4 shrink-0', isActive ? 'text-cream-50' : 'text-sage-600')} />
          <span className="min-w-0 flex-1">
            <span className="block truncate font-medium">{item.label}</span>
            {item.description ? (
              <span className={clsx('block truncate text-2xs', isActive ? 'text-cream-200/80' : 'text-ink-500')}>
                {item.description}
              </span>
            ) : null}
          </span>
        </>
      )}
    </NavLink>
  );
}

/**
 * Desktop sidebar. The mobile drawer reuses exactly the same items through the
 * AppShell, and the container is scrollable so nothing is ever unreachable.
 */
export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { cartCount, wishlistIds, unreadCount, pantryItems } = useAppData();
  const expiring = pantryItems.filter((item) => {
    const days = Math.round((new Date(`${item.expiryDate}T00:00:00`).getTime() - Date.now()) / 86_400_000);
    return days >= 0 && days <= 3;
  }).length;

  const badgeFor = (to: string): number | null => {
    if (to === '/cart') return cartCount || null;
    if (to === '/wishlist') return wishlistIds.size || null;
    if (to === '/notifications') return unreadCount || null;
    if (to === '/pantry') return expiring || null;
    return null;
  };

  return (
    <nav className="flex h-full flex-col gap-4 overflow-y-auto px-3 py-4">
      <div>
        <p className="px-3 pb-1.5 text-2xs font-semibold uppercase tracking-[0.14em] text-ink-500">Main</p>
        <div className="space-y-0.5">
          {MAIN_NAV.map((item) => (
            <div key={item.to} className="relative">
              <NavRow item={item} onNavigate={onNavigate} />
              {badgeFor(item.to) ? (
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-clay-500 px-1.5 py-0.5 text-2xs font-semibold text-white">
                  {badgeFor(item.to)}
                </span>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="px-3 pb-1.5 text-2xs font-semibold uppercase tracking-[0.14em] text-ink-500">Other</p>
        <div className="space-y-0.5">
          {OTHER_NAV.map((item) => (
            <div key={item.to} className="relative">
              <NavRow item={item} onNavigate={onNavigate} />
              {badgeFor(item.to) ? (
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-clay-500 px-1.5 py-0.5 text-2xs font-semibold text-white">
                  {badgeFor(item.to)}
                </span>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-auto rounded-2xl border border-cream-300 bg-cream-100 p-3.5">
        <p className="text-2xs font-semibold uppercase tracking-wide text-sage-600">Order in minutes</p>
        <p className="mt-1 text-xs leading-relaxed text-ink-600">
          Groceries are delivered in a 10–20 minute window. Orders can be cancelled within 60 seconds.
        </p>
      </div>
    </nav>
  );
}
