import { useMemo, useState } from 'react';
import { LifeBuoy, Mail, Search } from 'lucide-react';
import type { ReactNode } from 'react';
import { Accordion, Card, CardHeader, Chip, EmptyState, SectionHeader } from '@/components/ui/Primitives';
import { Button } from '@/components/ui/Button';

const SUPPORT_EMAIL = 'ragavikannan0207@gmail.com';

const FAQ: Array<{ category: string; question: string; answer: ReactNode }> = [
  {
    category: 'Orders & Delivery',
    question: 'How fast is delivery?',
    answer: 'Every order is promised inside a 10–20 minute window from the moment it is placed, and tracking moves through Confirmed, Processing, Packed, Out for Delivery and Delivered.',
  },
  {
    category: 'Orders & Delivery',
    question: 'Can I cancel after ordering?',
    answer: 'Yes — within the first 60 seconds. The cancel button disappears after that window closes, and the timer is based on the order timestamp so it stays correct even after a refresh.',
  },
  {
    category: 'Orders & Delivery',
    question: 'Where is my invoice?',
    answer: 'Open Orders → the order → Download invoice. The invoice contains the products, quantities, prices, taxes, delivery, totals, payment method and the purchased nutrition for that order.',
  },
  {
    category: 'Payments & Checkout',
    question: 'Which payment methods are supported?',
    answer: 'Cash on Delivery, UPI and card. UPI IDs and card details are validated before the order can be placed.',
  },
  {
    category: 'Payments & Checkout',
    question: 'Are my card details stored?',
    answer: 'No. Only a masked reference such as “Card ending 1234” is kept with the order. Full card numbers and CVV values are never stored.',
  },
  {
    category: 'Payments & Checkout',
    question: 'How are delivery and GST calculated?',
    answer: 'Delivery is free above ₹499, otherwise ₹39. GST is 5% on the discounted subtotal. Orders above ₹1,500 get 5% off and above ₹2,500 get 8% off.',
  },
  {
    category: 'Smart Features',
    question: 'How does Smart Grocery decide my basket?',
    answer: 'It combines the number of people, the duration, your budget, diet, goal and pantry stock. A ₹250 budget deliberately produces a much smaller basket than ₹2,500, and the basket never exceeds the budget you set.',
  },
  {
    category: 'Smart Features',
    question: 'What powers the For You page?',
    answer: 'Only real activity: your orders, pantry, wishlist, diet, goal, allergies, preferences and budget. With no history the page tells you to start shopping instead of inventing purchases.',
  },
  {
    category: 'Account & Profiles',
    question: 'Can one account shop for several people?',
    answer: 'Yes. Add a profile for each person, then switch with the “Shopping for” selector. Recommendations, pantry, recipes, meal plans, budget and Purchased Nutrition all follow the active person.',
  },
  {
    category: 'Account & Profiles',
    question: 'What happens to my data when I log out?',
    answer: 'Nothing is deleted. Logging out only ends the session — your account, profiles, pantry, orders and settings stay exactly as they were.',
  },
  {
    category: 'Pantry',
    question: 'Does an expired item disappear automatically?',
    answer: 'Never. Expired items stay in your pantry until you remove them, and freshness for unpackaged produce is labelled as an estimate.',
  },
  {
    category: 'Pantry',
    question: 'How does the pantry reduce what I buy?',
    answer: 'Recipes and the meal planner compare the quantity a recipe needs with what you already have, and only the missing quantity is added to the cart.',
  },
  {
    category: 'Recipes',
    question: 'How is recipe nutrition calculated?',
    answer: 'From the real nutrition values of every ingredient in the catalogue, scaled by the quantity used. Nothing on a recipe card is hand-written.',
  },
  {
    category: 'Recipes',
    question: 'Can I cook without adding anything to my cart?',
    answer: 'Yes. Recipe pages are read-only until you choose “Add missing ingredients” or “Add all ingredients”.',
  },
  {
    category: 'Nutrition',
    question: 'Is Purchased Nutrition the same as what I ate?',
    answer: 'No. It is the nutrition contained in the groceries you purchased, calculated from product values and quantities. It is not a consumption record and does not claim to be one.',
  },
  {
    category: 'Nutrition',
    question: 'Where do the daily targets come from?',
    answer: 'Age, gender, height, weight and activity level with the Mifflin-St Jeor equation, adjusted for your selected goal. They are guidance, not medical advice.',
  },
  {
    category: 'Budget',
    question: 'How is my spending calculated?',
    answer: 'From real, non-cancelled orders inside the selected weekly or monthly period. Cancelled orders never count towards a budget.',
  },
  {
    category: 'Budget',
    question: 'Do profiles share a budget?',
    answer: 'No. Each person keeps a separate budget and a separate spending view.',
  },
];

const CATEGORIES = [
  'Orders & Delivery',
  'Payments & Checkout',
  'Smart Features',
  'Account & Profiles',
  'Pantry',
  'Recipes',
  'Nutrition',
  'Budget',
];

function mailto(subject: string, body: string): string {
  return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/** Help Center with FAQ search and a real support email hand-off. */
export function HelpPage() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string>('All');

  const results = useMemo(() => {
    const term = query.trim().toLowerCase();
    return FAQ.filter((entry) => {
      if (category !== 'All' && entry.category !== category) return false;
      if (!term) return true;
      return `${entry.question} ${entry.category} ${String(entry.answer)}`.toLowerCase().includes(term);
    });
  }, [query, category]);

  return (
    <div className="space-y-5">
      <SectionHeader
        eyebrow="Support"
        title="Help Center"
        subtitle="Answers for orders, payments, profiles, pantry, recipes, nutrition and budget."
      />

      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search the FAQ…"
          aria-label="Search the FAQ"
          className="h-11 w-full rounded-2xl border border-cream-300 bg-white pl-10 pr-3 text-sm shadow-inset focus:border-forest-500 focus:outline-none focus:ring-2 focus:ring-forest-500/20"
        />
      </div>

      <div className="flex flex-wrap gap-1.5">
        <Chip active={category === 'All'} onClick={() => setCategory('All')}>
          All topics
        </Chip>
        {CATEGORIES.map((item) => (
          <Chip key={item} active={category === item} onClick={() => setCategory(item)}>
            {item}
          </Chip>
        ))}
      </div>

      {results.length === 0 ? (
        <EmptyState
          icon={<LifeBuoy className="h-4 w-4" />}
          title="No matching answers"
          description="Try another phrase, or contact support and we will reply by email."
          action={
            <Button
              onClick={() => {
                window.location.href = mailto('NutriCart Support Request', `Topic: ${query}\n\nDescribe your question here:`);
              }}
            >
              Contact support
            </Button>
          }
        />
      ) : (
        <Accordion items={results.map((entry, index) => ({ id: `faq-${index}`, question: entry.question, answer: entry.answer }))} />
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Contact support" subtitle="Opens your email app with a pre-filled message — nothing is sent automatically." />
          <div className="space-y-3 px-5 py-4">
            <p className="flex items-center gap-2 text-sm text-ink-700">
              <Mail className="h-4 w-4 text-sage-600" />
              {SUPPORT_EMAIL}
            </p>
            <Button
              icon={<Mail className="h-4 w-4" />}
              onClick={() => {
                window.location.href = mailto(
                  'NutriCart Support Request',
                  'Name:\nEmail:\nOrder number (if any):\nSubject:\n\nDescribe the issue:\n',
                );
              }}
            >
              Open email composer
            </Button>
          </div>
        </Card>

        <Card>
          <CardHeader title="Before you write" subtitle="These three answers resolve most questions" />
          <ul className="space-y-2 px-5 py-4 text-xs leading-relaxed text-ink-600">
            <li>• Tracking and cancellation live on the order page — cancellation is only possible for 60 seconds.</li>
            <li>• Purchased Nutrition reports the nutrition in what you bought, not what you consumed.</li>
            <li>• Switching the “Shopping for” person changes every personalised screen instantly.</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
