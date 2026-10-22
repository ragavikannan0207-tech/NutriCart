import { useState } from 'react';
import { BookOpen, Check, ClipboardList, Dumbbell, Mail, Target, TrendingUp } from 'lucide-react';
import { clsx } from 'clsx';
import { useAppData } from '@/state/hooks';
import { Badge, Card, CardHeader, SectionHeader } from '@/components/ui/Primitives';
import { Button, ButtonLink } from '@/components/ui/Button';
import { TextArea, TextInput } from '@/components/ui/Field';

const SUPPORT_EMAIL = 'ragavikannan0207@gmail.com';

const PLANS = [
  {
    id: '30-day',
    name: '30-Day Plan',
    price: 1500,
    duration: '30 days',
    description: 'A focused month of guided nutrition and training, rebuilt around your profile.',
    includes: ['Personalised diet guidance', 'Workout planning', 'Goal planning', 'Profile-based guidance', 'Progress guidance'],
  },
  {
    id: '6-month',
    name: '6-Month Plan',
    price: 7500,
    duration: '6 months',
    description: 'The full transformation programme with monthly checkpoints and adjustments.',
    includes: ['Personalised diet guidance', 'Workout planning', 'Goal planning', 'Profile-based guidance', 'Progress guidance'],
  },
];

/**
 * Personal Diet & Workout Plans — a separate service page.
 * It is deliberately NOT a grocery product and can never be added to the cart.
 */
export function DietPlansPage() {
  const { activeProfile, profiles } = useAppData();
  const [selected, setSelected] = useState(PLANS[0].id);
  const [profileName, setProfileName] = useState(activeProfile?.name ?? profiles[0]?.name ?? '');
  const [goal, setGoal] = useState(activeProfile?.healthGoal ?? '');
  const [message, setMessage] = useState('');

  const plan = PLANS.find((entry) => entry.id === selected) ?? PLANS[0];

  const mailto = () => {
    const body = [
      `Name: ${profileName || '—'}`,
      `Plan: ${plan.name}`,
      `Duration: ${plan.duration}`,
      `Profile: ${activeProfile ? `${activeProfile.name} (${activeProfile.age} yrs, ${activeProfile.activityLevel}, ${activeProfile.dietType})` : '—'}`,
      `Goal: ${goal || activeProfile?.healthGoal || '—'}`,
      `Message: ${message || '—'}`,
    ].join('\n');
    return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('NutriCart Personal Diet & Workout Plan Enquiry')}&body=${encodeURIComponent(body)}`;
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Service"
        title="Personal Diet & Workout Plans"
        subtitle="One-to-one guidance built from the same profile NutriCart already knows. This is a service, not a grocery product — it never enters your cart."
        action={<Badge tone="info">Not a grocery item</Badge>}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {PLANS.map((entry) => (
          <Card
            key={entry.id}
            className={clsx('flex flex-col p-5 transition', selected === entry.id ? 'border-forest-300 shadow-lift' : 'hover:border-forest-200')}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-ink-900">{entry.name}</p>
              {selected === entry.id ? <Badge tone="brand">Selected</Badge> : null}
            </div>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-forest-800">₹{entry.price.toLocaleString('en-IN')}</p>
            <p className="text-xs text-ink-500">for {entry.duration}</p>
            <p className="mt-3 text-xs leading-relaxed text-ink-600">{entry.description}</p>
            <ul className="mt-4 space-y-2">
              {entry.includes.map((item) => (
                <li key={item} className="flex items-start gap-2 text-xs text-ink-600">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-forest-600" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-auto pt-5">
              <Button fullWidth variant={selected === entry.id ? 'primary' : 'outline'} onClick={() => setSelected(entry.id)}>
                {selected === entry.id ? 'Selected' : `Choose ${entry.name}`}
              </Button>
            </div>
          </Card>
        ))}

        <Card className="p-5">
          <CardHeader title="How it works" className="px-0 pt-0" />
          <ul className="space-y-3 text-xs leading-relaxed text-ink-600">
            <li className="flex gap-2">
              <ClipboardList className="mt-0.5 h-4 w-4 shrink-0 text-sage-600" />
              Send the enquiry with your profile, goal and plan. Your NutriCart profile is used as the starting point.
            </li>
            <li className="flex gap-2">
              <Dumbbell className="mt-0.5 h-4 w-4 shrink-0 text-sage-600" />
              You get a diet framework, a workout split and a realistic goal timeline.
            </li>
            <li className="flex gap-2">
              <Target className="mt-0.5 h-4 w-4 shrink-0 text-sage-600" />
              Guidance is adapted to the same goal you selected in NutriCart.
            </li>
            <li className="flex gap-2">
              <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-sage-600" />
              Progress checkpoints keep the plan honest rather than aspirational.
            </li>
          </ul>
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Send your enquiry"
          subtitle="This opens your email app with a pre-filled message. Nothing is sent automatically."
          action={<span className="flex items-center gap-1.5 text-xs text-ink-500"><Mail className="h-3.5 w-3.5" /> {SUPPORT_EMAIL}</span>}
        />
        <div className="grid gap-4 px-5 py-4 lg:grid-cols-3">
          <TextInput label="Name" placeholder="Your name" value={profileName} onChange={(event) => setProfileName(event.target.value)} />
          <TextInput label="Goal" placeholder="Fat loss, muscle gain…" value={goal} onChange={(event) => setGoal(event.target.value)} />
          <TextInput label="Plan" value={`${plan.name} · ${plan.duration}`} readOnly />
          <div className="lg:col-span-3">
            <TextArea
              label="Anything the coach should know"
              placeholder="Current routine, injuries, food preferences, travel weeks…"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 border-t border-cream-200 px-5 py-4">
          <Button
            icon={<Mail className="h-4 w-4" />}
            onClick={() => {
              window.location.href = mailto();
            }}
          >
            Email the enquiry
          </Button>
          <p className="text-2xs leading-relaxed text-ink-500">
            Subject: “NutriCart Personal Diet &amp; Workout Plan Enquiry”. The message includes your name, plan, duration,
            profile, goal and notes.
          </p>
        </div>
      </Card>

      <Card className="flex flex-wrap items-center justify-between gap-3 bg-sage-50 p-4">
        <p className="flex items-center gap-2 text-xs leading-relaxed text-sage-700">
          <BookOpen className="h-3.5 w-3.5" />
          Want groceries that match the plan? Smart Grocery and the Meal Planner already follow your profile.
        </p>
        <div className="flex gap-2">
          <ButtonLink to="/smart-grocery" variant="outline" size="sm">
            Smart Grocery
          </ButtonLink>
          <ButtonLink to="/meal-planner" variant="ghost" size="sm">
            Meal Planner
          </ButtonLink>
        </div>
      </Card>
    </div>
  );
}
