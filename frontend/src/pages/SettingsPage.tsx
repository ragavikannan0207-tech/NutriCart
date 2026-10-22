import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Database, LogOut, Plus, RefreshCw, Trash2, UserRound } from 'lucide-react';
import type { PersonProfile, UserPreferences } from '@/types';
import { useAppData } from '@/state/hooks';
import { useAuth } from '@/state/AuthContext';
import { useToast } from '@/state/ToastContext';
import { DEFAULT_PREFERENCES } from '@/services/contracts';
import { modeDescription } from '@/services';
import { ProfileForm } from '@/components/profile/ProfileForm';
import { ProfileList } from '@/components/profile/ProfileList';
import { Badge, Card, CardHeader, Divider, SectionHeader, Tabs } from '@/components/ui/Primitives';
import { Button } from '@/components/ui/Button';
import { Switch, TextInput } from '@/components/ui/Field';
import { Dropdown, toOptions } from '@/components/ui/Dropdown';
import { ConfirmDialog, Modal } from '@/components/ui/Modal';

/**
 * Settings — profile management, active person, notifications, periods, pantry
 * units, meal preferences and application preferences. Everything persists.
 */
export function SettingsPage() {
  const {
    profiles,
    activeProfile,
    updateProfile,
    createProfile,
    deleteProfile,
    setActiveProfile,
    preferences,
    savePreferences,
    budget,
    saveBudget,
    clearAllLocalData,
    refresh,
  } = useAppData();
  const { user, updateAccount, logout, mode } = useAuth();
  const toast = useToast();
  const [params] = useSearchParams();
  const [tab, setTab] = useState<'profile' | 'notifications' | 'preferences' | 'account'>(
    (params.get('tab') as 'profile' | 'notifications' | 'preferences' | 'account' | null) ?? 'profile',
  );
  const [editing, setEditing] = useState<PersonProfile | null>(null);
  const [adding, setAdding] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<PersonProfile | null>(null);
  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [budgetAmount, setBudgetAmount] = useState(String(budget?.amount ?? activeProfile?.budgetAmount ?? 2500));
  const [draft, setDraft] = useState<UserPreferences>(preferences);

  useEffect(() => setDraft(preferences), [preferences]);
  useEffect(() => setBudgetAmount(String(budget?.amount ?? activeProfile?.budgetAmount ?? 2500)), [budget, activeProfile]);

  const update = (patch: Partial<UserPreferences>) => {
    const next = { ...draft, ...patch };
    setDraft(next);
    void savePreferences(next);
  };

  return (
    <div className="space-y-5">
      <SectionHeader
        eyebrow="Configuration"
        title="Settings"
        subtitle="Manage the people on this account and how NutriCart behaves for each of them."
        action={<Badge tone={mode === 'api' ? 'success' : 'warning'}>{mode === 'api' ? 'Spring Boot API' : 'On-device storage'}</Badge>}
      />

      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { value: 'profile', label: 'Profiles', count: profiles.length },
          { value: 'notifications', label: 'Notifications' },
          { value: 'preferences', label: 'Preferences' },
          { value: 'account', label: 'Account' },
        ]}
        className="max-w-2xl"
      />

      {tab === 'profile' ? (
        <div className="space-y-4">
          <Card>
            <CardHeader
              title="People on this account"
              subtitle="The active person drives recommendations, pantry, plans and budgets."
              action={
                <Button size="sm" icon={<Plus className="h-3.5 w-3.5" />} onClick={() => setAdding(true)}>
                  Add person
                </Button>
              }
            />
            <div className="px-5 py-4">
              <ProfileList
                profiles={profiles}
                onSelect={async (id) => {
                  await setActiveProfile(id);
                  toast.success('Active person updated');
                }}
                onEdit={(profile) => setEditing(profile)}
                onDelete={(profile) => setPendingDelete(profile)}
              />
            </div>
          </Card>

          <Card>
            <CardHeader title="Budget for the active person" subtitle="Weekly or monthly — spending always comes from real orders." />
            <div className="flex flex-wrap items-end gap-3 px-5 py-4">
              <TextInput
                label="Budget amount"
                inputMode="numeric"
                value={budgetAmount}
                onChange={(event) => setBudgetAmount(event.target.value.replace(/\D/g, ''))}
                wrapperClassName="w-40"
              />
              <div className="space-y-1.5">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-600">Period</p>
                <Dropdown
                  value={budget?.period ?? activeProfile?.budgetPeriod ?? 'Weekly'}
                  options={toOptions(['Weekly', 'Monthly'])}
                  onChange={(value) => void saveBudget(Number(budgetAmount || 0), value as 'Weekly' | 'Monthly')}
                />
              </div>
              <Button onClick={() => void saveBudget(Number(budgetAmount || 0), budget?.period ?? 'Weekly')}>Save budget</Button>
            </div>
          </Card>

          <Card>
            <CardHeader title="Nutrition period" subtitle="Default period used by Purchased Nutrition." />
            <div className="px-5 py-4">
              <Dropdown
                value={draft.nutritionPeriod}
                options={toOptions(['Daily', 'Weekly', 'Monthly'])}
                onChange={(value) => update({ nutritionPeriod: value as UserPreferences['nutritionPeriod'] })}
                className="max-w-xs"
              />
            </div>
          </Card>
        </div>
      ) : null}

      {tab === 'notifications' ? (
        <Card>
          <CardHeader title="Notifications" subtitle="Only real events — orders, pantry expiry, budget warnings and weekly plans." />
          <div className="space-y-3 px-5 py-4">
            <Switch checked={draft.notifyOrderUpdates} onChange={(value) => update({ notifyOrderUpdates: value })} label="Order updates" description="Confirmed, out for delivery, delivered and cancelled." />
            <Switch checked={draft.notifyPantryExpiry} onChange={(value) => update({ notifyPantryExpiry: value })} label="Pantry expiry alerts" description="Warn when a pantry item is within three days of its expiry date." />
            <Switch checked={draft.notifyBudgetAlerts} onChange={(value) => update({ notifyBudgetAlerts: value })} label="Budget warnings" description="Alert when a person's spend passes the budget you set." />
            <Switch checked={draft.notifyRecommendations} onChange={(value) => update({ notifyRecommendations: value })} label="New recommendations" description="Tell me when better picks appear for the active person." />
            <Switch checked={draft.notifyWeeklyPlan} onChange={(value) => update({ notifyWeeklyPlan: value })} label="Weekly plan reminders" description="Remind me to review the meal plan shopping list." />
          </div>
        </Card>
      ) : null}

      {tab === 'preferences' ? (
        <div className="space-y-4">
          <Card>
            <CardHeader title="Pantry & units" />
            <div className="grid gap-4 px-5 py-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-600">Default pantry unit</p>
                <Dropdown value={draft.defaultPantryUnit} options={toOptions(['g', 'kg', 'piece'])} onChange={(value) => update({ defaultPantryUnit: value as UserPreferences['defaultPantryUnit'] })} />
              </div>
              <div className="space-y-1.5">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-600">Measurement system</p>
                <Dropdown value={draft.measurementSystem} options={toOptions(['Metric', 'Imperial'])} onChange={(value) => update({ measurementSystem: value as UserPreferences['measurementSystem'] })} />
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="Meal preferences" subtitle="Used to bias recommendations and meal plans." />
            <div className="px-5 py-4">
              <Dropdown
                value={draft.mealPreference}
                options={toOptions(['High Protein', 'Balanced', 'Low Carb', 'Light'])}
                onChange={(value) => update({ mealPreference: value as UserPreferences['mealPreference'] })}
                className="max-w-xs"
              />
            </div>
          </Card>

          <Card>
            <CardHeader title="Application" />
            <div className="space-y-3 px-5 py-4">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-cream-300 bg-white p-3">
                <div>
                  <p className="text-sm font-medium text-ink-800">Data layer</p>
                  <p className="mt-0.5 max-w-2xl text-xs leading-relaxed text-ink-500">{modeDescription(mode)}</p>
                </div>
                <Button variant="outline" size="sm" icon={<RefreshCw className="h-3.5 w-3.5" />} onClick={() => void refresh()}>
                  Refresh data
                </Button>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-clay-400/30 bg-clay-100/40 p-3">
                <div>
                  <p className="text-sm font-medium text-ink-800">Reset local data</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-ink-500">
                    Clears everything stored in this browser, including the signed-in session. Only useful in on-device storage mode.
                  </p>
                </div>
                <Button variant="danger" size="sm" icon={<Database className="h-3.5 w-3.5" />} onClick={clearAllLocalData}>
                  Clear browser data
                </Button>
              </div>
              <p className="text-2xs leading-relaxed text-ink-500">
                Defaults: {Object.entries(DEFAULT_PREFERENCES).length} preference keys are versioned with the app, so new
                settings appear automatically.
              </p>
            </div>
          </Card>
        </div>
      ) : null}

      {tab === 'account' ? (
        <div className="space-y-4">
          <Card>
            <CardHeader title="Account" subtitle={user?.email} />
            <div className="flex flex-wrap items-end gap-3 px-5 py-4">
              <TextInput label="Full name" value={fullName} onChange={(event) => setFullName(event.target.value)} wrapperClassName="w-64" />
              <Button
                onClick={async () => {
                  await updateAccount(fullName);
                  toast.success('Account updated');
                }}
              >
                Save name
              </Button>
            </div>
          </Card>

          <Card>
            <CardHeader title="Session" subtitle="Logging out never deletes the account or any person profile." />
            <div className="flex flex-wrap gap-2 px-5 py-4">
              <Button variant="outline" icon={<LogOut className="h-4 w-4" />} onClick={() => void logout()}>
                Logout
              </Button>
            </div>
          </Card>

          <Card>
            <CardHeader title="Profiles summary" />
            <ul className="divide-y divide-cream-200">
              {profiles.map((profile) => (
                <li key={profile.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <span className="flex items-center gap-2 text-sm text-ink-700">
                    <UserRound className="h-4 w-4 text-sage-600" />
                    {profile.name}
                    {profile.isActive ? <Badge tone="brand">Active</Badge> : null}
                  </span>
                  <span className="text-xs text-ink-500">
                    {profile.dietType} · {profile.healthGoal} · ₹{profile.budgetAmount} / {profile.budgetPeriod.toLowerCase()}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
          <Divider />
        </div>
      ) : null}

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing ? `Edit ${editing.name}` : 'Edit person'}
        size="lg"
      >
        {editing ? (
          <ProfileForm
            initial={editing}
            submitLabel="Save changes"
            onCancel={() => setEditing(null)}
            onSubmit={async (input) => {
              await updateProfile(editing.id, input);
              toast.success(`${input.name} updated`);
              setEditing(null);
            }}
          />
        ) : null}
      </Modal>

      <Modal open={adding} onClose={() => setAdding(false)} title="Add a person" size="lg">
        <ProfileForm
          submitLabel="Add person"
          onCancel={() => setAdding(false)}
          onSubmit={async (input) => {
            const created = await createProfile(input);
            toast.success(`${created.name} added`);
            setAdding(false);
          }}
        />
      </Modal>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title={`Delete ${pendingDelete?.name ?? 'this person'}?`}
        message="Their pantry items and meal plans are removed with the profile. Orders and invoices stay in your history."
        confirmLabel="Delete person"
        tone="danger"
        onCancel={() => setPendingDelete(null)}
        onConfirm={async () => {
          try {
            if (pendingDelete) await deleteProfile(pendingDelete.id);
            toast.success('Person removed');
          } catch {
            toast.error('Could not delete that person', 'At least one person has to stay on the account.');
          } finally {
            setPendingDelete(null);
          }
        }}
      />

      {profiles.length > 0 ? (
        <p className="flex items-center gap-2 text-2xs text-ink-500">
          <Trash2 className="h-3 w-3" />
          Deleting a person never deletes your orders, invoices or purchased nutrition history.
        </p>
      ) : null}
    </div>
  );
}
