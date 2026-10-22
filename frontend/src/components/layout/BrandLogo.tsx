import { Link } from 'react-router-dom';
import { clsx } from 'clsx';

/**
 * NutriCart wordmark + leaf-basket mark.
 * One component, used by the auth screens, the app header and the invoice.
 */
export function BrandLogo({
  size = 'md',
  to = '/overview',
  showTagline,
  className,
}: {
  size?: 'sm' | 'md' | 'lg';
  to?: string;
  showTagline?: boolean;
  className?: string;
}) {
  const sizes = {
    sm: { mark: 'h-7 w-7', title: 'text-sm', tagline: 'text-2xs' },
    md: { mark: 'h-8 w-8', title: 'text-base', tagline: 'text-xs' },
    lg: { mark: 'h-11 w-11', title: 'text-xl', tagline: 'text-sm' },
  } as const;
  const scale = sizes[size];

  return (
    <Link to={to} className={clsx('inline-flex items-center gap-2.5 transition hover:opacity-90', className)}>
      <span className={clsx('flex shrink-0 items-center justify-center rounded-xl bg-forest-700 text-cream-50 shadow-sm', scale.mark)}>
        <svg viewBox="0 0 24 24" fill="none" className="h-4/6 w-4/6" aria-hidden>
          <path d="M6 9h12l-1.2 9.2a2 2 0 0 1-2 1.8H9.2a2 2 0 0 1-2-1.8L6 9Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M9 9V7.5a3 3 0 0 1 6 0V9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M12 12.4c1.9-2.1 3.6-2 3.9.5-.2 2.1-2.1 3.2-3.9 2.1-1.8 1.1-3.7 0-3.9-2.1.3-2.5 2-2.6 3.9-.5Z" fill="currentColor" />
        </svg>
      </span>
      <span className="min-w-0">
        <span className={clsx('block font-semibold tracking-tight text-ink-900', scale.title)}>
          Nutri<span className="text-forest-700">Cart</span>
        </span>
        {showTagline ? (
          <span className={clsx('block font-medium text-sage-600', scale.tagline)}>Shop Smart. Eat Healthy.</span>
        ) : null}
      </span>
    </Link>
  );
}
