import { useState, type FormEvent } from 'react';
import {
  ACTIVITY_LEVELS,
  DIET_TYPES,
  GENDERS,
  HEALTH_GOALS,
  type PersonProfile,
  type PersonProfileInput,
} from '@/types';
import { Button } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/Field';
import { Dropdown, toOptions } from '@/components/ui/Dropdown';
import { validateAge } from '@/utils/validation';

const BUDGET_PERIODS = ['Weekly', 'Monthly'] as const;

interface ProfileFormValues {
  name: string;
  age: string;
  gender: string;
  heightCm: string;
  weightKg: string;
  activityLevel: string;
  dietType: string;
  healthGoal: string;
  budgetAmount: string;
  budgetPeriod: string;
  allergies: string;
  foodPreferences: string;
}

function toValues(profile?: PersonProfile | null): ProfileFormValues {
  return {
    name: profile?.name ?? '',
    age: profile ? String(profile.age) : '',
    gender: profile?.gender ?? 'Prefer not to say',
    heightCm: profile ? String(profile.heightCm) : '',
    weightKg: profile ? String(profile.weightKg) : '',
    activityLevel: profile?.activityLevel ?? 'Lightly Active',
    dietType: profile?.dietType ?? 'No Restriction',
    healthGoal: profile?.healthGoal ?? 'General Healthy Eating',
    budgetAmount: profile ? String(profile.budgetAmount) : '2500',
    budgetPeriod: profile?.budgetPeriod ?? 'Weekly',
    allergies: (profile?.allergies ?? []).join(', '),
    foodPreferences: (profile?.foodPreferences ?? []).join(', '),
  };
}

function parseList(value: string): string[] {
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

/**
 * The person-profile form. Used for the first profile after registration, for
 * "Add Person" and for editing an existing person, so every field is defined here
 * exactly once.
 */
export function ProfileForm({
  initial,
  onSubmit,
  submitLabel = 'Save profile',
  onCancel,
  showBudget = true,
}: {
  initial?: PersonProfile | null;
  onSubmit: (input: PersonProfileInput) => Promise<void>;
  submitLabel?: string;
  onCancel?: () => void;
  showBudget?: boolean;
}) {
  const [values, setValues] = useState<ProfileFormValues>(() => toValues(initial));
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [submitting, setSubmitting] = useState(false);

  const set = (patch: Partial<ProfileFormValues>) => setValues((current) => ({ ...current, ...patch }));

  const validate = () => {
    const age = Number(values.age);
    const height = Number(values.heightCm);
    const weight = Number(values.weightKg);
    const next: Record<string, string | undefined> = {
      name: values.name.trim().length < 2 ? 'Enter the person name' : undefined,
      age: validateAge(age),
      heightCm: height >= 80 && height <= 250 ? undefined : 'Height must be between 80 and 250 cm',
      weightKg: weight >= 15 && weight <= 300 ? undefined : 'Weight must be between 15 and 300 kg',
      budgetAmount: showBudget && values.budgetAmount === '' ? 'Enter a budget amount' : undefined,
    };
    setErrors(next);
    return Object.values(next).every((value) => !value);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await onSubmit({
        name: values.name.trim(),
        age: Number(values.age),
        gender: values.gender as PersonProfileInput['gender'],
        heightCm: Number(values.heightCm),
        weightKg: Number(values.weightKg),
        activityLevel: values.activityLevel as PersonProfileInput['activityLevel'],
        dietType: values.dietType as PersonProfileInput['dietType'],
        healthGoal: values.healthGoal as PersonProfileInput['healthGoal'],
        budgetAmount: Number(values.budgetAmount || 0),
        budgetPeriod: values.budgetPeriod as PersonProfileInput['budgetPeriod'],
        allergies: parseList(values.allergies),
        foodPreferences: parseList(values.foodPreferences),
        isActive: initial?.isActive ?? false,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <TextInput
          label="Name"
          required
          placeholder="Ragavi"
          value={values.name}
          error={errors.name}
          onChange={(event) => set({ name: event.target.value })}
        />
        <TextInput
          label="Age"
          required
          inputMode="numeric"
          placeholder="28"
          value={values.age}
          error={errors.age}
          hint="Between 1 and 100"
          onChange={(event) => set({ age: event.target.value.replace(/[^0-9]/g, '') })}
        />
        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-600">Gender</p>
          <Dropdown value={values.gender} options={toOptions(GENDERS)} onChange={(value) => set({ gender: value })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <TextInput
            label="Height (cm)"
            required
            inputMode="numeric"
            placeholder="172"
            value={values.heightCm}
            error={errors.heightCm}
            onChange={(event) => set({ heightCm: event.target.value.replace(/[^0-9.]/g, '') })}
          />
          <TextInput
            label="Weight (kg)"
            required
            inputMode="numeric"
            placeholder="68"
            value={values.weightKg}
            error={errors.weightKg}
            onChange={(event) => set({ weightKg: event.target.value.replace(/[^0-9.]/g, '') })}
          />
        </div>
        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-600">Activity level</p>
          <Dropdown value={values.activityLevel} options={toOptions(ACTIVITY_LEVELS)} onChange={(value) => set({ activityLevel: value })} />
        </div>
        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-600">Diet type</p>
          <Dropdown value={values.dietType} options={toOptions(DIET_TYPES)} onChange={(value) => set({ dietType: value })} />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-600">Health goal</p>
          <Dropdown value={values.healthGoal} options={toOptions(HEALTH_GOALS)} onChange={(value) => set({ healthGoal: value })} />
        </div>

        {showBudget ? (
          <>
            <TextInput
              label="Grocery budget"
              inputMode="numeric"
              placeholder="2500"
              value={values.budgetAmount}
              error={errors.budgetAmount}
              hint="Amount in rupees"
              onChange={(event) => set({ budgetAmount: event.target.value.replace(/[^0-9]/g, '') })}
            />
            <div className="space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-600">Budget period</p>
              <Dropdown value={values.budgetPeriod} options={toOptions(BUDGET_PERIODS)} onChange={(value) => set({ budgetPeriod: value })} />
            </div>
          </>
        ) : null}

        <TextInput
          label="Allergies"
          placeholder="peanut, lactose"
          value={values.allergies}
          hint="Comma separated — used to filter recommendations."
          onChange={(event) => set({ allergies: event.target.value })}
        />
        <TextInput
          label="Food preferences"
          placeholder="high protein, low fat"
          value={values.foodPreferences}
          hint="Comma separated — matched against product tags."
          onChange={(event) => set({ foodPreferences: event.target.value })}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="submit" loading={submitting}>
          {submitLabel}
        </Button>
        {onCancel ? (
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
      </div>
    </form>
  );
}
