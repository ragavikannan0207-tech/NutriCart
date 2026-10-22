import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ChevronRight, Heart, Minus, Plus, ShieldCheck, ShoppingCart, Truck } from 'lucide-react';
import { clsx } from 'clsx';
import { getProductById, healthierAlternativesOf, relatedProductsOf } from '@/data/products';
import { RECIPES } from '@/data/recipes';
import { useAppData } from '@/state/hooks';
import { ProductGrid } from '@/components/product/ProductGrid';
import { ProductImage } from '@/components/product/ProductCard';
import { Badge, Card, CardHeader, Divider, EmptyState, NutritionRow, Rating, SectionHeader } from '@/components/ui/Primitives';
import { Button, ButtonLink } from '@/components/ui/Button';
import { formatCurrency, formatGrams } from '@/utils/format';

/** Product Details — a product-focused shopping page for one catalogue item. */
export function ProductDetailsPage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const product = getProductById(Number(productId));
  const { cart, addToCart, setCartQuantity, wishlistIds, toggleWishlist, addManyToCart } = useAppData();
  const [quantity, setQuantity] = useState(1);

  const related = useMemo(() => (product ? relatedProductsOf(product, 4) : []), [product]);
  const alternatives = useMemo(() => (product ? healthierAlternativesOf(product, 4) : []), [product]);
  const usedInRecipes = useMemo(
    () => (product ? RECIPES.filter((recipe) => recipe.ingredients.some((item) => item.productId === product.id)) : []),
    [product],
  );

  if (!product) {
    return (
      <EmptyState
        title="We could not find that product"
        description="It may have been removed from the catalogue."
        action={<ButtonLink to="/shop" size="sm">Back to Shop Groceries</ButtonLink>}
      />
    );
  }

  const inCart = cart.find((line) => line.productId === product.id)?.quantity ?? 0;
  const isWishlisted = wishlistIds.has(product.id);
  const outOfStock = product.stockCount <= 0;
  const savings = product.mrp > product.price ? product.mrp - product.price : 0;

  return (
    <div className="space-y-7">
      <nav className="flex flex-wrap items-center gap-1 text-xs text-ink-500" aria-label="Breadcrumb">
        <Link to="/shop" className="hover:text-forest-700">
          Shop Groceries
        </Link>
        <ChevronRight className="h-3 w-3" />
        <Link to={`/shop?category=${encodeURIComponent(product.category)}`} className="hover:text-forest-700">
          {product.category}
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="font-medium text-ink-700">{product.name}</span>
      </nav>

      <div className="grid gap-6 lg:grid-cols-[1.05fr_1fr]">
        <Card className="overflow-hidden">
          <div className="relative aspect-[4/3] bg-cream-100">
            <ProductImage product={product} sizes="(min-width: 1024px) 560px, 100vw" />
            <div className="absolute left-3 top-3 flex flex-col gap-1.5">
              {product.isBestseller ? <Badge tone="brand">Bestseller</Badge> : null}
              {product.isNew ? <Badge tone="info">New in catalogue</Badge> : null}
              {savings > 0 ? <Badge tone="warning">Save {formatCurrency(savings)}</Badge> : null}
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2 border-t border-cream-200 p-3">
            {[product.image, ...related.slice(0, 3).map((item) => item.image)].map((image, index) => (
              <div
                key={`${image}-${index}`}
                className={clsx(
                  'aspect-square overflow-hidden rounded-xl border',
                  index === 0 ? 'border-forest-300' : 'border-cream-300',
                )}
              >
                <img src={image} alt={index === 0 ? product.name : 'Related product'} className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="info">{product.category}</Badge>
              {product.secondaryCategories.map((category) => (
                <Badge key={category} tone="neutral">
                  {category}
                </Badge>
              ))}
              <Badge tone={outOfStock ? 'danger' : product.availability === 'Low Stock' ? 'warning' : 'success'}>
                {product.availability}
              </Badge>
            </div>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink-900">{product.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-4">
              <Rating value={product.rating} count={product.reviewCount} size="md" />
              <span className="text-xs text-ink-500">{product.reviewCount} verified reviews</span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-ink-600">{product.description}</p>
          </div>

          <Card className="p-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-2xl font-semibold tracking-tight text-ink-900">{formatCurrency(product.price)}</p>
                <p className="text-xs text-ink-500">
                  {product.unit}
                  {savings > 0 ? <span className="ml-2 line-through">{formatCurrency(product.mrp)}</span> : null}
                </p>
              </div>
              <p className="text-xs text-ink-500">
                Pack weight {formatGrams(product.packGrams)} · {product.stockCount} left in stock
              </p>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-1 rounded-xl border border-cream-300 bg-white p-1">
                <Button variant="ghost" size="sm" onClick={() => setQuantity((current) => Math.max(1, current - 1))} aria-label="Decrease quantity">
                  <Minus className="h-3.5 w-3.5" />
                </Button>
                <span className="min-w-8 text-center text-sm font-semibold tabular-nums">{quantity}</span>
                <Button variant="ghost" size="sm" onClick={() => setQuantity((current) => Math.min(20, current + 1))} aria-label="Increase quantity">
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>

              <Button
                size="lg"
                icon={<ShoppingCart className="h-4 w-4" />}
                disabled={outOfStock}
                onClick={() => void addToCart(product.id, quantity)}
              >
                Add to Cart{inCart > 0 ? ` (${inCart} in cart)` : ''}
              </Button>
              <Button
                size="lg"
                variant="secondary"
                disabled={outOfStock}
                onClick={async () => {
                  await addToCart(product.id, quantity);
                  navigate('/checkout');
                }}
              >
                Buy Now
              </Button>
              <Button
                variant="outline"
                size="lg"
                icon={<Heart className={clsx('h-4 w-4', isWishlisted && 'fill-clay-500 text-clay-500')} />}
                onClick={() => void toggleWishlist(product.id)}
              >
                {isWishlisted ? 'In Wishlist' : 'Wishlist'}
              </Button>
            </div>

            {inCart > 0 ? (
              <div className="mt-3 flex items-center gap-2 text-xs text-forest-700">
                <span>{inCart} in your cart</span>
                <Button variant="ghost" size="sm" onClick={() => void setCartQuantity(product.id, 0)}>
                  Remove
                </Button>
              </div>
            ) : null}

            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              <div className="flex items-center gap-2 rounded-xl bg-cream-100 px-3 py-2 text-2xs text-ink-600">
                <Truck className="h-3.5 w-3.5 text-sage-600" />
                Delivered in 10–20 minutes
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-cream-100 px-3 py-2 text-2xs text-ink-600">
                <ShieldCheck className="h-3.5 w-3.5 text-sage-600" />
                Cancel free within 60 seconds
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-cream-100 px-3 py-2 text-2xs text-ink-600">
                <ShieldCheck className="h-3.5 w-3.5 text-sage-600" />
                Free delivery over ₹{499}
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="Nutrition" subtitle={product.nutritionBasis} />
            <div className="grid gap-x-6 px-5 py-3 sm:grid-cols-2">
              <NutritionRow label="Calories" value={product.calories} unit="kcal" highlight />
              <NutritionRow label="Protein" value={product.protein} unit="g" highlight />
              <NutritionRow label="Carbohydrates" value={product.carbs} unit="g" />
              <NutritionRow label="Fat" value={product.fat} unit="g" />
              <NutritionRow label="Fibre" value={product.fiber} unit="g" />
            </div>
            <Divider />
            <div className="px-5 py-3">
              <p className="text-2xs font-semibold uppercase tracking-wide text-ink-500">Per purchased unit</p>
              <div className="mt-1 grid gap-x-6 sm:grid-cols-2">
                <NutritionRow label="Calories" value={product.nutritionPerUnit.calories} unit="kcal" />
                <NutritionRow label="Protein" value={product.nutritionPerUnit.protein} unit="g" />
                <NutritionRow label="Carbs" value={product.nutritionPerUnit.carbs} unit="g" />
                <NutritionRow label="Fat" value={product.nutritionPerUnit.fat} unit="g" />
                <NutritionRow label="Fibre" value={product.nutritionPerUnit.fiber} unit="g" />
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="Healthy benefits" subtitle="Why this product earns its place in a NutriCart basket" />
            <ul className="space-y-2 px-5 py-4">
              {product.healthyBenefits.map((benefit) => (
                <li key={benefit} className="flex items-start gap-2 text-xs leading-relaxed text-ink-600">
                  <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sage-600" />
                  {benefit}
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-1.5 px-5 pb-4">
              {product.tags.map((tag) => (
                <span key={tag} className="rounded-full border border-cream-300 bg-cream-100 px-2.5 py-1 text-2xs text-ink-600">
                  {tag}
                </span>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {alternatives.length > 0 ? (
        <section className="space-y-3">
          <SectionHeader
            title="Healthy Alternatives"
            subtitle="A lighter or higher protein version of this aisle"
            action={
              
              <ButtonLink to="/healthy-alternatives" variant="outline" size="sm">
                Compare all swaps
              </ButtonLink>
            }
          />
          <ProductGrid products={alternatives} compact />
        </section>
      ) : null}

      {usedInRecipes.length > 0 ? (
        <section className="space-y-3">
          <SectionHeader title="Used in these recipes" subtitle="Cook it into a full meal" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {usedInRecipes.slice(0, 3).map((recipe) => (
              <Link
                key={recipe.id}
                to={`/recipes/${recipe.id}`}
                className="flex items-center gap-3 rounded-2xl border border-cream-300 bg-white p-3 shadow-card transition hover:-translate-y-0.5 hover:shadow-lift"
              >
                <img src={recipe.image} alt={recipe.name} className="h-14 w-14 rounded-xl object-cover" loading="lazy" />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-ink-800">{recipe.name}</span>
                  <span className="block text-xs text-ink-500">
                    {recipe.calories} kcal · {recipe.protein} g protein
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {related.length > 0 ? (
        <section className="space-y-3">
          <SectionHeader title="Related Products" subtitle="Frequently bought with this item" />
          <ProductGrid products={related} compact />
        </section>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => void addManyToCart([{ productId: product.id, quantity }])} disabled={outOfStock}>
          Add {quantity} to cart
        </Button>
        <ButtonLink to="/shop" variant="ghost" size="sm">
          Continue shopping
        </ButtonLink>
      </div>
    </div>
  );
}
