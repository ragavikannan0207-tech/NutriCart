import { useState } from 'react';
import { clsx } from 'clsx';
import { Check, ChevronDown, LogOut, Settings, UserPlus, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAppData } from '@/state/hooks';
import { useAuth } from '@/state/AuthContext';
import { useDismissable } from '@/hooks';
import { initialsOf } from '@/utils/format';

/**
 * "Shopping for Ragavi" selector — the single control that re-personalises the
 * whole application (Shop, Smart Grocery, Pantry, Recipes, Meal Planner, For You,
 * Purchased Nutrition, Budget and Healthy Alternatives).
 */
export function ProfileSwitcher({ compact }: { compact?: boolean }) {
  const { profiles, activeProfile, setActiveProfile, needsProfileSetup } = useAppData();
  const { logout, user } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useDismissable<HTMLDivElement>(open, () => setOpen(false));

  if (needsProfileSetup) {
    return (
      <Link
        to="/onboarding"
        className="inline-flex items-center gap-2 rounded-xl border border-forest-200 bg-forest-50 px-3 py-2 text-xs font-semibold text-forest-800"
      >
        <UserPlus className="h-3.5 w-3.5" />
        Set up a person
      </Link>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={clsx(
          'flex items-center gap-2 rounded-xl border border-cream-300 bg-white px-2.5 py-2 transition hover:border-forest-300',
          compact && 'px-2',
        )}
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-forest-700 text-2xs font-semibold text-cream-50">
          {initialsOf(activeProfile?.name ?? user?.fullName ?? 'NC')}
        </span>
        <span className="hidden min-w-0 text-left sm:block">
          <span className="block text-2xs uppercase tracking-wide text-ink-500">Shopping for</span>
          <span className="block truncate text-xs font-semibold text-ink-800">{activeProfile?.name ?? 'Add a person'}</span>
        </span>
        <ChevronDown className={clsx('h-4 w-4 shrink-0 text-ink-500 transition-transform', open && 'rotate-180')} />
      </button>

      {open ? (
        <div role="menu" className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-cream-300 bg-white p-1.5 shadow-lift animate-scale-in">
          <p className="px-3 py-2 text-2xs font-semibold uppercase tracking-wide text-ink-500">
            {profiles.length} {profiles.length === 1 ? 'person' : 'people'} on this account
          </p>
          {profiles.map((profile) => (
            <button
              key={profile.id}
              type="button"
              role="menuitem"
              onClick={() => {
                void setActiveProfile(profile.id);
                setOpen(false);
              }}
              className={clsx(
                'flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm transition',
                profile.id === activeProfile?.id ? 'bg-forest-50 text-forest-800' : 'text-ink-700 hover:bg-cream-100',
              )}
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sage-100 text-2xs font-semibold text-sage-700">
                {initialsOf(profile.name)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{profile.name}</span>
                <span className="block truncate text-2xs text-ink-500">
                  {profile.age} yrs · {profile.healthGoal}
                </span>
              </span>
              {profile.id === activeProfile?.id ? <Check className="h-4 w-4 text-forest-700" /> : null}
            </button>
          ))}

          <div className="my-1 h-px bg-cream-200" />
          <Link to="/onboarding" onClick={() => setOpen(false)} className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-ink-700 transition hover:bg-cream-100">
            <UserPlus className="h-4 w-4 text-sage-600" />
            Add Person
          </Link>
          <Link to="/settings?tab=profiles" onClick={() => setOpen(false)} className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-ink-700 transition hover:bg-cream-100">
            <Users className="h-4 w-4 text-sage-600" />
            Manage Profiles
          </Link>
          <Link to="/settings" onClick={() => setOpen(false)} className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-ink-700 transition hover:bg-cream-100">
            <Settings className="h-4 w-4 text-sage-600" />
            Settings
          </Link>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              void logout();
            }}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm text-clay-500 transition hover:bg-clay-100"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      ) : null}
    </div>
  );
}
