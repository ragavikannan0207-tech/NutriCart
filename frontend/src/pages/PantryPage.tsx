import { useMemo, useState, type FormEvent } from 'react';
import { ChefHat, Minus, Package, Pencil, Plus, Trash2 } from 'lucide-react';
import { clsx } from 'clsx';
import type { Category, PantryItem, PantryItemInput } from '@/types';
import { CATEGORIES } from '@/types';
import { PRODUCTS, getProductById } from '@/data/products';
import { RECIPES } from '@/data/recipes';
import { compareRecipeWithPantry, countByFreshness, freshnessOf, shelfLifeDaysFor, todayIso } from '@/domain/pantry';
import { useAppData } from '@/state/hooks';
import { useToast } from '@/state/ToastContext';
import { Badge, Card, Divider, EmptyState, SectionHeader, StatTile, Tabs } from '@/components/ui/Primitives';
import { Button, ButtonLink } from '@/components/ui/Button';
import { TextArea, TextInput } from '@/components/ui/Field';
import { Dropdown, toOptions } from '@/components/ui/Dropdown';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { formatDate } from '@/utils/format';
import { formatQuantity } from '@/utils/units';

const EMPTY_DRAFT: PantryItemInput = {
  personProfileId: 0,
  productId: null,
  name: '',
  category: 'Vegetables',
  quantity: 0,
  unit: 'g',
  purchaseDate: todayIso(),
  expiryDate: '',
  notes: '',
};

/**
 * My Pantry — the user's real kitchen inventory. Deliberately NOT the cart.
 * Expired items are never deleted automatically; freshness is estimated only for
 * fresh produce and is labelled as an estimate.
 */
export function PantryPage() {
  const { pantryItems, activeProfile, createPantryItem, updatePantryItem, deletePantryItem, adjustPantryItem } = useAppData();
  const toast = useToast();
  const [tab, setTab] = useState<'all' | 'fresh' | 'soon' | 'expired'>('all');
  const [draft, setDraft] = useState<PantryItemInput | null>(null);
  const [editing, setEditing] = useState<PantryItem | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PantryItem | null>(null);
  const [search, setSearch] = useState('');

  const counts = useMemo(() => countByFreshness(pantryItems), [pantryItems]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return pantryItems.filter((item) => {
      const status = freshnessOf(item).status;
      if (tab === 'fresh' && status !== 'Fresh') return false;
      if (tab === 'soon' && status !== 'Expiring Soon') return false;
      if (tab === 'expired' && status !== 'Expired') return false;
      if (term && !`${item.name} ${item.category}`.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [pantryItems, tab, search]);

  const cookableRecipes = useMemo(
    () =>
      RECIPES.map((recipe) => ({ recipe, comparison: compareRecipeWithPantry(recipe, pantryItems, getProductById) }))
        .filter((entry) => entry.comparison.hasPantryData)
        .sort((a, b) => a.comparison.missingCount - b.comparison.missingCount)
        .slice(0, 4),
    [pantryItems],
  );

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!draft) return;
    if (draft.quantity <= 0) {
      toast.error('Enter a quantity greater than zero');
      return;
    }
    const payload: PantryItemInput = {
      ...draft,
      name: draft.name.trim() || getProductById(draft.productId ?? -1)?.name || 'Pantry item',
      personProfileId: activeProfile?.id ?? 0,
      expiryEstimated: !draft.expiryDate,
    };
    if (editing) await updatePantryItem(editing.id, payload);
    else await createPantryItem(payload);
    toast.success(editing ? 'Pantry item updated' : 'Pantry item added');
    setDraft(null);
    setEditing(null);
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink-900">My Pantry</h1>
          <p className="mt-1 max-w-2xl text-sm text-ink-500">
            What is actually in the kitchen{activeProfile ? ` for ${activeProfile.name}` : ''}. Recipe matching and the meal
            planner subtract this stock before adding anything to your cart.
          </p>
        </div>
        <div className="flex gap-2">
          <ButtonLink to="/recipes" variant="outline" size="sm" icon={<ChefHat className="h-3.5 w-3.5" />}>
            What can I cook?
          </ButtonLink>
          <Button size="sm" icon={<Plus className="h-3.5 w-3.5" />} onClick={() => setDraft({ ...EMPTY_DRAFT, personProfileId: activeProfile?.id ?? 0 })}>
            Add item
          </Button>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Items tracked" value={pantryItems.length} hint="Across every category" icon={<Package className="h-4 w-4" />} />
        <StatTile label="Fresh" value={counts.fresh} tone="brand" hint="More than 3 days left" />
        <StatTile label="Expiring soon" value={counts.expiring} tone="warning" hint="Within the next 3 days" />
        <StatTile label="Expired" value={counts.expired} tone="danger" hint="Nothing is deleted automatically" />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { value: 'all', label: 'All', count: pantryItems.length },
            { value: 'fresh', label: 'Fresh', count: counts.fresh },
            { value: 'soon', label: 'Expiring', count: counts.expiring },
            { value: 'expired', label: 'Expired', count: counts.expired },
          ]}
          className="max-w-lg"
        />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search your pantry…"
          className="h-9 flex-1 rounded-xl border border-cream-300 bg-white px-3 text-sm shadow-inset focus:border-forest-500 focus:outline-none"
          aria-label="Search pantry"
        />
      </div>

      {pantryItems.length === 0 ? (
        <EmptyState
          icon={<Package className="h-4 w-4" />}
          title="Your pantry is empty"
          description="Add the groceries you already have at home — or push items across from a placed order — and NutriCart will stop you buying duplicates."
          action={<Button onClick={() => setDraft({ ...EMPTY_DRAFT, personProfileId: activeProfile?.id ?? 0 })}>Add your first item</Button>}
        />
      ) : filtered.length === 0 ? (
        <EmptyState compact title="Nothing in this view" description="Try another tab or clear the search." />
      ) : (
        <Card>
          <ul className="divide-y divide-cream-200">
            {filtered.map((item) => {
              const freshness = freshnessOf(item);
              const product = getProductById(item.productId ?? undefined);
              return (
                <li key={item.id} className="flex flex-wrap items-center gap-4 px-4 py-3">
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-cream-300 bg-cream-100">
                    {product ? <img src={product.image} alt="" className="h-full w-full object-cover" loading="lazy" /> : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-semibold text-ink-900">{item.name}</p>
                      <Badge tone={freshness.tone === 'danger' ? 'danger' : freshness.tone === 'warning' ? 'warning' : 'success'}>
                        {freshness.status}
                      </Badge>
                      {item.expiryEstimated ? <Badge tone="neutral">Freshness estimated</Badge> : <Badge tone="info">Printed date</Badge>}
                    </div>
                    <p className="mt-0.5 text-xs text-ink-500">
                      {item.category} · bought {formatDate(item.purchaseDate)} · expires {formatDate(item.expiryDate)} ({freshness.label})
                    </p>
                    {item.notes ? <p className="mt-0.5 text-2xs text-ink-500">{item.notes}</p> : null}
                  </div>

                  <div className="flex items-center gap-1 rounded-xl border border-cream-300 bg-white p-0.5">
                    <Button variant="ghost" size="sm" onClick={() => void adjustPantryItem(item.id, -1)} aria-label="Decrease quantity">
                      <Minus className="h-3.5 w-3.5" />
                    </Button>
                    <span className="min-w-16 text-center text-xs font-semibold tabular-nums text-ink-800">
                      {formatQuantity(item.quantity, item.unit)}
                    </span>
                    <Button variant="ghost" size="sm" onClick={() => void adjustPantryItem(item.id, 1)} aria-label="Increase quantity">
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Pencil className="h-3.5 w-3.5" />}
                      aria-label={`Edit ${item.name}`}
                      onClick={() => {
                        setEditing(item);
                        setDraft({
                          personProfileId: item.personProfileId,
                          productId: item.productId,
                          name: item.name,
                          category: item.category,
                          quantity: item.quantity,
                          unit: item.unit,
                          purchaseDate: item.purchaseDate,
                          expiryDate: item.expiryDate,
                          notes: item.notes,
                        });
                      }}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-clay-500 hover:bg-clay-100"
                      icon={<Trash2 className="h-3.5 w-3.5" />}
                      aria-label={`Delete ${item.name}`}
                      onClick={() => setPendingDelete(item)}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      {cookableRecipes.length > 0 ? (
        <section className="space-y-3">
          <SectionHeader
            title="Cook from what you have"
            subtitle="Recipes matched against your pantry — only the missing quantities go to the cart"
            action={<ButtonLink to="/recipes" variant="outline" size="sm">All recipes</ButtonLink>}
          />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {cookableRecipes.map(({ recipe, comparison }) => (
              <Card key={recipe.id} className="overflow-hidden">
                <img src={recipe.image} alt={recipe.name} className="h-28 w-full object-cover" loading="lazy" />
                <div className="space-y-1.5 p-3.5">
                  <p className="text-sm font-semibold text-ink-900">{recipe.name}</p>
                  <p className={clsx('text-xs', comparison.missingCount === 0 ? 'text-forest-700' : 'text-ink-500')}>
                    {comparison.missingCount === 0
                      ? 'Everything is in your pantry'
                      : `${comparison.missingCount} ingredient${comparison.missingCount === 1 ? '' : 's'} missing`}
                  </p>
                  <ButtonLink to={`/recipes/${recipe.id}`} size="sm" variant="outline" fullWidth>
                    Open recipe
                  </ButtonLink>
                </div>
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      <Modal
        open={Boolean(draft)}
        onClose={() => {
          setDraft(null);
          setEditing(null);
        }}
        title={editing ? `Edit ${editing.name}` : 'Add a pantry item'}
        description="Link a catalogue product to unlock exact recipe comparison. Non-catalogue items are supported too."
        footer={
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setDraft(null);
                setEditing(null);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" form="pantry-form">
              {editing ? 'Save changes' : 'Add to pantry'}
            </Button>
          </div>
        }
      >
        {draft ? (
          <form id="pantry-form" onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-600">Catalogue product</p>
              <Dropdown
                value={draft.productId ?? -1}
                onChange={(value) => {
                  const product = getProductById(Number(value));
                  setDraft((current) =>
                    current
                      ? {
                          ...current,
                          productId: product?.id ?? null,
                          name: product?.name ?? current.name,
                          category: product?.category ?? current.category,
                          unit: product?.packUnit ?? current.unit,
                          quantity: product?.packSize ?? current.quantity,
                          expiryDate: '',
                        }
                      : current,
                  );
                }}
                options={[
                  { value: -1, label: 'Custom item (not in catalogue)' },
                  ...PRODUCTS.map((product) => ({ value: product.id, label: product.name, description: `${product.category} · ${product.unit}` })),
                ]}
              />
            </div>

            <TextInput label="Item name" required value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
            <div className="space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-600">Category</p>
              <Dropdown value={draft.category} options={toOptions(CATEGORIES)} onChange={(value) => setDraft({ ...draft, category: value as Category })} />
            </div>
            <TextInput
              label="Quantity"
              inputMode="decimal"
              required
              value={String(draft.quantity || '')}
              onChange={(event) => setDraft({ ...draft, quantity: Number(event.target.value.replace(/[^0-9.]/g, '')) })}
            />
            <div className="space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-600">Unit</p>
              <Dropdown value={draft.unit} options={toOptions(['g', 'kg', 'ml', 'l', 'piece', 'pack'])} onChange={(value) => setDraft({ ...draft, unit: value })} />
            </div>
            <TextInput
              label="Purchase date"
              type="date"
              value={draft.purchaseDate}
              onChange={(event) => setDraft({ ...draft, purchaseDate: event.target.value })}
            />
            <TextInput
              label="Expiry / best before"
              type="date"
              value={draft.expiryDate}
              hint={
                draft.productId
                  ? `Leave empty to estimate freshness from the product type (about ${shelfLifeDaysFor(getProductById(draft.productId), draft.name)} days).`
                  : 'Leave empty to estimate freshness from the item type.'
              }
              onChange={(event) => setDraft({ ...draft, expiryDate: event.target.value })}
            />
            <div className="sm:col-span-2">
              <TextArea label="Notes" placeholder="Opened pack, half used…" value={draft.notes} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} />
            </div>
          </form>
        ) : null}
      </Modal>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Remove this pantry item?"
        message={`${pendingDelete?.name ?? ''} will be removed from your pantry. This does not affect any order history.`}
        confirmLabel="Remove item"
        tone="danger"
        onCancel={() => setPendingDelete(null)}
        onConfirm={async () => {
          if (pendingDelete) await deletePantryItem(pendingDelete.id);
          setPendingDelete(null);
          toast.success('Pantry item removed');
        }}
      />

      <Divider />
      <p className="text-2xs leading-relaxed text-ink-500">
        Freshness for unpackaged produce is calculated from the product type and the purchase date and is always labelled
        as an estimate. Expired items stay in your pantry until you remove them.
      </p>
    </div>
  );
}
