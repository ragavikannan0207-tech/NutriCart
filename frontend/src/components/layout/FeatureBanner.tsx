import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { clsx } from 'clsx';
import { ArrowRight, ChefHat, Compass, Package, Repeat, Sparkles, TrendingUp, CalendarRange, type LucideIcon } from 'lucide-react';

interface Slide {
  title: string;
  description: string;
  cta: string;
  to: string;
  icon: LucideIcon;
  image: string;
  tint: string;
}

/**
 * The seven-slide premium banner. It rotates every 4 seconds with a long, smooth
 * transition and every CTA navigates to the feature it describes.
 */
const SLIDES: Slide[] = [
  {
    title: 'Smart Grocery',
    description: 'Tell NutriCart your budget, your people and your goal — get a basket that fits all three.',
    cta: 'Plan My Groceries',
    to: '/smart-grocery',
    icon: Sparkles,
    image: '/brand/banner-smart-grocery.svg',
    tint: 'from-forest-800 via-forest-700 to-sage-600',
  },
  {
    title: 'My Pantry',
    description: 'Track what is actually in the kitchen, with fresh, expiring and expired status on every item.',
    cta: 'View Pantry',
    to: '/pantry',
    icon: Package,
    image: '/brand/banner-pantry.svg',
    tint: 'from-sage-800 via-sage-700 to-sage-500',
  },
  {
    title: 'Recipes',
    description: 'Cook from your own stock — NutriCart compares every ingredient against your pantry.',
    cta: 'Explore Recipes',
    to: '/recipes',
    icon: ChefHat,
    image: '/brand/banner-recipes.svg',
    tint: 'from-forest-900 via-forest-700 to-forest-500',
  },
  {
    title: 'Meal Planner',
    description: 'Plan breakfast, lunch and dinner for the week and buy only the missing quantities.',
    cta: 'Plan My Meals',
    to: '/meal-planner',
    icon: CalendarRange,
    image: '/brand/banner-meal-planner.svg',
    tint: 'from-sage-900 via-forest-700 to-sage-500',
  },
  {
    title: 'For You',
    description: 'Recommendations built from your real orders, pantry, wishlist, diet and goal.',
    cta: 'Explore For You',
    to: '/for-you',
    icon: Compass,
    image: '/brand/banner-for-you.svg',
    tint: 'from-forest-700 via-sage-600 to-sage-400',
  },
  {
    title: 'Healthy Alternatives',
    description: 'Swap chips, sugary cereal or soft drinks for grocery picks that keep the crunch and drop the junk.',
    cta: 'Find Alternatives',
    to: '/healthy-alternatives',
    icon: Repeat,
    image: '/brand/banner-alternatives.svg',
    tint: 'from-sage-700 via-forest-600 to-sage-400',
  },
  {
    title: 'Purchased Nutrition',
    description: 'See the calories, protein, carbs, fat and fibre provided by the groceries you bought.',
    cta: 'View Purchased Nutrition',
    to: '/purchased-nutrition',
    icon: TrendingUp,
    image: '/brand/banner-nutrition.svg',
    tint: 'from-forest-800 via-sage-600 to-forest-500',
  },
];

export function FeatureBanner() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % SLIDES.length), 4000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <section className="relative overflow-hidden rounded-3xl border border-forest-900/10 shadow-card" aria-label="NutriCart features">
      <div className="relative h-56 sm:h-60">
        {SLIDES.map((slide, slideIndex) => (
          <div
            key={slide.title}
            className={clsx(
              'absolute inset-0 flex items-center bg-gradient-to-r transition-all duration-700 ease-smooth',
              slide.tint,
              slideIndex === index ? 'translate-x-0 opacity-100' : 'pointer-events-none translate-x-4 opacity-0',
            )}
            aria-hidden={slideIndex !== index}
          >
            <img src={slide.image} alt="" className="absolute inset-y-0 right-0 hidden h-full w-2/5 object-cover opacity-90 lg:block" />
            <div className="relative z-10 max-w-xl px-5 py-6 sm:px-8">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-2xs font-semibold uppercase tracking-[0.14em] text-cream-50 backdrop-blur">
                <slide.icon className="h-3.5 w-3.5" />
                NutriCart smart feature
              </span>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-cream-50 sm:text-3xl">{slide.title}</h2>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-cream-200">{slide.description}</p>
              <Link
                to={slide.to}
                className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-cream-50 px-4 text-sm font-semibold text-forest-800 transition hover:bg-white"
              >
                {slide.cta}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        ))}
      </div>

      <div className="absolute bottom-3 left-5 flex gap-1.5 sm:left-8">
        {SLIDES.map((slide, slideIndex) => (
          <button
            key={slide.title}
            type="button"
            onClick={() => setIndex(slideIndex)}
            aria-label={`Show ${slide.title}`}
            className={clsx(
              'h-1.5 rounded-full transition-all duration-500',
              slideIndex === index ? 'w-6 bg-cream-50' : 'w-1.5 bg-cream-50/50 hover:bg-cream-50/80',
            )}
          />
        ))}
      </div>
    </section>
  );
}
