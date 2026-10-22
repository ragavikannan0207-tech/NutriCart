import { Loader2 } from 'lucide-react';
import { BrandLogo } from './BrandLogo';

/** Shown while the backend is resolving or account data is loading. */
export function FullPageSpinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-cream-100">
      <BrandLogo size="lg" to="/login" showTagline />
      <div className="flex items-center gap-2 text-sm text-ink-500">
        <Loader2 className="h-4 w-4 animate-spin text-forest-600" />
        {label}
      </div>
    </div>
  );
}
