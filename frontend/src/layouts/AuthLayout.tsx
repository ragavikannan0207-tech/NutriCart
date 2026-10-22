import type { ReactNode } from 'react';
import { BrandLogo } from '@/components/layout/BrandLogo';

/** Split layout used by Login, Register and Profile Setup. */
export function AuthLayout({
  title,
  subtitle,
  children,
  aside,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <div className="grid min-h-screen bg-cream-100 lg:grid-cols-[1.05fr_1fr]">
      <div className="flex flex-col justify-center px-5 py-10 sm:px-10 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          <BrandLogo size="lg" to="/login" showTagline className="mb-8" />
          <h1 className="text-2xl font-semibold tracking-tight text-ink-900">{title}</h1>
          {subtitle ? <p className="mt-1.5 text-sm leading-relaxed text-ink-500">{subtitle}</p> : null}
          <div className="mt-6">{children}</div>
        </div>
      </div>

      <div className="relative hidden overflow-hidden bg-forest-800 lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(143,189,153,0.35),transparent_55%)]" />
        <div className="relative flex h-full flex-col justify-between p-12 text-cream-100">
          <p className="text-2xs font-semibold uppercase tracking-[0.2em] text-sage-300">NutriCart</p>
          <div className="max-w-md space-y-5">
            <h2 className="text-3xl font-semibold leading-tight tracking-tight text-cream-50">
              Groceries that understand the person you are shopping for.
            </h2>
            <p className="text-sm leading-relaxed text-cream-200">
              One cart, one wishlist and one order history — enriched with pantry tracking, recipe matching,
              budget-aware baskets and the nutrition of everything you buy.
            </p>
            {aside}
          </div>
          <ul className="grid gap-2 text-xs text-cream-200">
            <li>• 56 product catalogue across nine grocery aisles</li>
            <li>• Multiple person profiles on a single account</li>
            <li>• 10–20 minute delivery with 60 second cancellation</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
