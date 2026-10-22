/**
 * ---------------------------------------------------------------------------
 * NutriCart catalogue exporter
 * ---------------------------------------------------------------------------
 * The catalogue is authored ONCE in the frontend (src/data/seed/*) and consumed
 * twice:
 *
 *   • by the React app, through src/data/products.ts + src/data/recipes.ts
 *   • by the Spring Boot backend, through the JSON files written here
 *     (backend/src/main/resources/catalog/products.json + recipes.json)
 *
 * The JSON is generated from the *built* catalogue — including the derived
 * values (basisAmount, packGrams, availability, stockCount, computed recipe
 * nutrition) — so the browser and MySQL can never disagree.
 *
 * Run with:  npm run catalog   (run it again after editing any seed file)
 *
 * esbuild is used to load the TypeScript seed modules directly, so no build
 * step or duplicated data is required.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const here = dirname(fileURLToPath(import.meta.url));
const frontendDir = resolve(here, '..');
const srcDir = resolve(frontendDir, 'src');
const catalogDir = resolve(frontendDir, '..', 'backend', 'src', 'main', 'resources', 'catalog');
const require = createRequire(import.meta.url);

const ENTRY = `
  export { PRODUCTS } from '@/data/products';
  export { RECIPES } from '@/data/recipes';
`;

async function loadCatalogue() {
  const outfile = resolve(frontendDir, 'node_modules', '.cache', 'nutricart-catalogue.cjs');
  mkdirSync(dirname(outfile), { recursive: true });
  await build({
    stdin: { contents: ENTRY, loader: 'ts', resolveDir: srcDir },
    bundle: true,
    platform: 'node',
    format: 'cjs',
    outfile,
    alias: { '@': srcDir },
    logLevel: 'warning',
  });
  return require(outfile);
}

function toProduct(product) {
  return {
    code: product.code,
    name: product.name,
    category: product.category,
    secondaryCategories: product.secondaryCategories ?? [],
    price: product.price,
    mrp: product.mrp,
    unit: product.unit,
    packSize: product.packSize,
    packUnit: product.packUnit,
    nutritionBasis: product.nutritionBasis,
    basisAmount: product.basisAmount,
    packGrams: product.packGrams,
    description: product.description,
    rating: product.rating,
    reviewCount: product.reviewCount,
    availability: product.availability,
    stockCount: product.stockCount,
    calories: product.calories,
    protein: product.protein,
    carbs: product.carbs,
    fat: product.fat,
    fiber: product.fiber,
    dietType: product.dietType,
    tags: product.tags,
    keywords: product.keywords,
    healthyBenefits: product.healthyBenefits,
    relatedCodes: product.relatedCodes ?? [],
    alternativeCodes: product.alternativeCodes ?? [],
    isNew: product.isNew,
    isBestseller: product.isBestseller,
    createdAt: product.createdAt,
  };
}

function toRecipe(recipe, codeById) {
  return {
    code: recipe.code,
    name: recipe.name,
    description: recipe.description,
    prepTimeMinutes: recipe.prepTimeMinutes,
    cookTimeMinutes: recipe.cookTimeMinutes,
    servings: recipe.servings,
    dietType: recipe.dietType,
    mealSlots: recipe.mealSlots,
    tags: recipe.tags,
    steps: recipe.steps,
    swapCodes: recipe.swapCodes ?? [],
    // Nutrition is computed from the catalogue by src/data/recipes.ts — never
    // hand-written — and is stored on the recipe for fast reads.
    calories: recipe.calories,
    protein: recipe.protein,
    carbs: recipe.carbs,
    fat: recipe.fat,
    fiber: recipe.fiber,
    ingredients: recipe.ingredients.map((ingredient) => ({
      // Ingredient lines travel by product CODE: the database assigns its own
      // ids, so the seeder resolves ids from the code at insert time.
      productCode: codeById.get(ingredient.productId),
      quantity: ingredient.quantity,
      unit: ingredient.unit,
      normalisedQuantity: ingredient.normalisedQuantity,
      normalisedUnit: ingredient.normalisedUnit,
      optional: ingredient.optional,
      note: ingredient.note,
    })),
  };
}

async function main() {
  const { PRODUCTS, RECIPES } = await loadCatalogue();
  const codeById = new Map(PRODUCTS.map((product) => [product.id, product.code]));

  const products = PRODUCTS.map(toProduct);
  const recipes = RECIPES.map((recipe) => toRecipe(recipe, codeById));

  const missing = recipes.flatMap((recipe) =>
    recipe.ingredients.filter((ingredient) => !ingredient.productCode).map(() => recipe.code),
  );
  if (missing.length > 0) {
    throw new Error(`Recipes reference unknown products: ${[...new Set(missing)].join(', ')}`);
  }

  mkdirSync(catalogDir, { recursive: true });
  writeFileSync(resolve(catalogDir, 'products.json'), `${JSON.stringify(products, null, 2)}\n`);
  writeFileSync(resolve(catalogDir, 'recipes.json'), `${JSON.stringify(recipes, null, 2)}\n`);

  console.log(`Exported ${products.length} products and ${recipes.length} recipes to ${catalogDir}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});