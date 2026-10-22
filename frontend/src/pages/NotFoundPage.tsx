import { Compass } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { EmptyState } from '@/components/ui/Primitives';
import { Button, ButtonLink } from '@/components/ui/Button';
import { useAuth } from '@/state/AuthContext';

/** Friendly 404 for any unknown route. */
export function NotFoundPage() {
  const { status } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-xl py-10">
      <EmptyState
        icon={<Compass className="h-4 w-4" />}
        title="That page does not exist in NutriCart"
        description="The link may be outdated. Head back to your grocery home and continue shopping."
        action={
          <div className="flex gap-2">
            <ButtonLink to={status === 'authenticated' ? '/overview' : '/login'} icon={<Compass className="h-4 w-4" />}>
              {status === 'authenticated' ? 'Go to Overview' : 'Go to Login'}
            </ButtonLink>
            <Button variant="outline" onClick={() => navigate(-1)}>
              Go back
            </Button>
          </div>
        }
      />
    </div>
  );
}
