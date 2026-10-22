import { Check, Pencil, Trash2, UserRound } from 'lucide-react';
import { clsx } from 'clsx';
import type { PersonProfile } from '@/types';
import { Badge } from '@/components/ui/Primitives';
import { Button } from '@/components/ui/Button';
import { initialsOf } from '@/utils/format';

/** The list of people on the account, with the active person highlighted. */
export function ProfileList({
  profiles,
  onSelect,
  onEdit,
  onDelete,
  compact,
}: {
  profiles: PersonProfile[];
  onSelect?: (id: number) => void;
  onEdit?: (profile: PersonProfile) => void;
  onDelete?: (profile: PersonProfile) => void;
  compact?: boolean;
}) {
  return (
    <ul className="space-y-2">
      {profiles.map((profile) => (
        <li
          key={profile.id}
          className={clsx(
            'flex flex-wrap items-center gap-3 rounded-2xl border bg-white p-3 transition',
            profile.isActive ? 'border-forest-300 bg-forest-50/60' : 'border-cream-300',
          )}
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sage-100 text-xs font-semibold text-sage-700">
            {initialsOf(profile.name) || <UserRound className="h-4 w-4" />}
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-sm font-semibold text-ink-900">{profile.name}</p>
              {profile.isActive ? <Badge tone="brand">Shopping now</Badge> : null}
            </div>
            {!compact ? (
              <p className="mt-0.5 truncate text-xs text-ink-500">
                {profile.age} yrs · {profile.heightCm} cm · {profile.weightKg} kg · {profile.activityLevel}
              </p>
            ) : null}
            <p className="mt-0.5 truncate text-xs text-ink-500">
              {profile.dietType} · {profile.healthGoal} · budget {profile.budgetPeriod.toLowerCase()} ₹{profile.budgetAmount}
            </p>
            {profile.allergies.length > 0 ? (
              <p className="mt-0.5 truncate text-2xs text-clay-500">Allergies: {profile.allergies.join(', ')}</p>
            ) : null}
          </div>

          <div className="flex items-center gap-1.5">
            {onSelect && !profile.isActive ? (
              <Button variant="outline" size="sm" icon={<Check className="h-3.5 w-3.5" />} onClick={() => onSelect(profile.id)}>
                Shop for
              </Button>
            ) : null}
            {onEdit ? (
              <Button variant="ghost" size="sm" icon={<Pencil className="h-3.5 w-3.5" />} onClick={() => onEdit(profile)} aria-label={`Edit ${profile.name}`} />
            ) : null}
            {onDelete ? (
              <Button
                variant="ghost"
                size="sm"
                className="text-clay-500 hover:bg-clay-100"
                icon={<Trash2 className="h-3.5 w-3.5" />}
                onClick={() => onDelete(profile)}
                aria-label={`Delete ${profile.name}`}
              />
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
