import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { BookOpen, Bot, HeartPulse, Salad, Wallet } from 'lucide-react';
import { AuthLayout } from '@/layouts/AuthLayout';
import { Card, CardHeader } from '@/components/ui/Primitives';
import { ProfileForm } from '@/components/profile/ProfileForm';
import { ProfileList } from '@/components/profile/ProfileList';
import { useAppData } from '@/state/hooks';
import { useToast } from '@/state/ToastContext';

/**
 * Profile Setup. Reached after registration and whenever an account has no person
 * yet. The account can hold several people, so the page also lists what already
 * exists and lets the user pick who is active.
 */
export function ProfileSetupPage() {
  const { profiles, createProfile, setActiveProfile } = useAppData();
  const toast = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const manageMode = params.get('manage') === '1';

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);

  const benefits = [
    { icon: Salad, text: 'Diet and allergies filter every product you see.' },
    { icon: HeartPulse, text: 'Goals drive the Smart Grocery basket and For You picks.' },
    { icon: Wallet, text: 'Each person keeps a separate budget and spending view.' },
    { icon: Bot, text: 'Pantry, recipes and meal plans follow the active person.' },
    { icon: BookOpen, text: 'Purchased Nutrition is calculated per person, per order.' },
  ];

  return (
    <AuthLayout
      title={profiles.length === 0 ? 'Who are you shopping for?' : manageMode ? 'Manage people' : 'Add another person'}
      subtitle="Everything in NutriCart — recommendations, smart baskets, pantry comparisons, budgets and nutrition — follows the person you select here."
      aside={
        <Card className="!border-forest-700 !bg-forest-900">
          <CardHeader
            title={<span className="text-cream-50">What the profile changes</span>}
            className="!border-forest-700"
          />
          <ul className="space-y-2.5 px-5 py-4">
            {benefits.map((benefit) => (
              <li key={benefit.text} className="flex items-start gap-2.5 text-xs leading-relaxed text-cream-100">
                <benefit.icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sage-200" />
                {benefit.text}
              </li>
            ))}
          </ul>
        </Card>
      }
    >
      <div className="space-y-6">
        {profiles.length > 0 ? (
          <ProfileList
            profiles={profiles}
            compact
            onSelect={async (id) => {
              if (manageMode) {
                await setActiveProfile(id);
                navigate('/overview');
              } else {
                await setActiveProfile(id);
                toast.success('Active person updated');
                navigate('/overview');
              }
            }}
          />
        ) : null}

        <Card>
          <CardHeader
            title={profiles.length === 0 ? 'Person details' : 'New person'}
            subtitle="Age, height, weight, activity and goal are used to calculate real nutrition targets."
          />
          <div className="px-5 py-4">
            <ProfileForm
              submitLabel={profiles.length === 0 ? 'Create profile and continue' : 'Add person'}
              onCancel={profiles.length > 0 ? () => navigate('/settings?tab=profiles') : undefined}
              onSubmit={async (input) => {
                const created = await createProfile(input);
                toast.success(`${created.name} is ready`, 'Your personalised NutriCart is set up.');
                navigate('/overview', { replace: true });
              }}
            />
          </div>
        </Card>
      </div>
    </AuthLayout>
  );
}
