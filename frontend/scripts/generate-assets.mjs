/**
 * ---------------------------------------------------------------------------
 * NutriCart asset generator
 * ---------------------------------------------------------------------------
 * Produces the product, recipe, banner and brand artwork used across the app.
 *
 * Why generated artwork instead of remote photos?
 *   • a product card can never show a broken or hot-linked image,
 *   • every product/food gets its OWN relevant, recognisable illustration,
 *   • the repository stays free of large binary dependencies,
 *   • the artwork is deterministic, so builds are reproducible.
 *
 * Run with:  npm run assets   (also runs automatically before `npm run build`)
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const publicDir = resolve(here, '..', 'public');

const CATEGORY_TINTS = {
  Fruits: ['#fef3e2', '#f7c873'],
  Vegetables: ['#eaf5e6', '#8fbd99'],
  Protein: ['#fdf0e8', '#e08a5f'],
  Grains: ['#f7f1e3', '#c9a24a'],
  Dairy: ['#f2f7fb', '#8fb8d6'],
  'Healthy Snacks': ['#f6efe6', '#c98f52'],
  'Fitness Foods': ['#eef3ea', '#6d8758'],
  Drinks: ['#e9f4f6', '#6fb0bb'],
  'Everyday Groceries': ['#f4f2ea', '#9aa07a'],
};

const DEFAULT_TINT = ['#f4efe2', '#8ba376'];

/** code -> [glyph, category] for every catalogue product. */
const PRODUCTS = {
  'hass-avocado': ['\u{1F951}', 'Fruits'],
  apple: ['\u{1F34E}', 'Fruits'],
  banana: ['\u{1F34C}', 'Fruits'],
  orange: ['\u{1F34A}', 'Fruits'],
  pomegranate: ['\u{1F347}', 'Fruits'],
  papaya: ['\u{1F96D}', 'Fruits'],
  watermelon: ['\u{1F349}', 'Fruits'],
  kiwi: ['\u{1F95D}', 'Fruits'],
  'baby-spinach': ['\u{1F96C}', 'Vegetables'],
  broccoli: ['\u{1F966}', 'Vegetables'],
  carrot: ['\u{1F955}', 'Vegetables'],
  tomato: ['\u{1F345}', 'Vegetables'],
  cucumber: ['\u{1F952}', 'Vegetables'],
  capsicum: ['\u{1FAD1}', 'Vegetables'],
  'sweet-potato': ['\u{1F360}', 'Vegetables'],
  beetroot: ['\u{1F9C4}', 'Vegetables'],
  onion: ['\u{1F9C5}', 'Vegetables'],
  potato: ['\u{1F954}', 'Vegetables'],
  'farm-fresh-eggs': ['\u{1F95A}', 'Protein'],
  paneer: ['\u{1F9C0}', 'Protein'],
  'low-fat-paneer': ['\u{1F9C0}', 'Fitness Foods'],
  tofu: ['\u{1FAD8}', 'Fitness Foods'],
  'greek-yogurt': ['\u{1F963}', 'Dairy'],
  'soy-chunks': ['\u{1FAD8}', 'Fitness Foods'],
  chickpeas: ['\u{1FAD8}', 'Protein'],
  rajma: ['\u{1FAD8}', 'Protein'],
  'moong-dal': ['\u{1F963}', 'Protein'],
  'mixed-dal': ['\u{1F963}', 'Protein'],
  sprouts: ['\u{1F331}', 'Protein'],
  'brown-rice': ['\u{1F35A}', 'Grains'],
  quinoa: ['\u{1F35A}', 'Grains'],
  oats: ['\u{1F963}', 'Grains'],
  'protein-oats': ['\u{1F963}', 'Fitness Foods'],
  'multigrain-bread': ['\u{1F35E}', 'Grains'],
  'whole-wheat-bread': ['\u{1F35E}', 'Grains'],
  'ragi-flour': ['\u{1F33E}', 'Grains'],
  millet: ['\u{1F33E}', 'Grains'],
  'high-protein-granola': ['\u{1F963}', 'Fitness Foods'],
  'roasted-makhana': ['\u{1F365}', 'Healthy Snacks'],
  almonds: ['\u{1F330}', 'Healthy Snacks'],
  walnuts: ['\u{1F330}', 'Healthy Snacks'],
  'peanut-butter': ['\u{1F95C}', 'Healthy Snacks'],
  'high-protein-peanut-butter': ['\u{1F95C}', 'Fitness Foods'],
  'trail-mix': ['\u{1F36A}', 'Healthy Snacks'],
  'roasted-chickpeas': ['\u{1FAD8}', 'Healthy Snacks'],
  'dark-chocolate': ['\u{1F36B}', 'Healthy Snacks'],
  'baked-chips': ['\u{1F35F}', 'Healthy Snacks'],
  'protein-chips': ['\u{1F35F}', 'Fitness Foods'],
  'protein-bar': ['\u{1F36B}', 'Fitness Foods'],
  'low-fat-milk': ['\u{1F95B}', 'Dairy'],
  curd: ['\u{1F963}', 'Dairy'],
  buttermilk: ['\u{1F95B}', 'Dairy'],
  'coconut-water': ['\u{1F965}', 'Drinks'],
  'protein-milkshake': ['\u{1F964}', 'Drinks'],
  'cooking-oil': ['\u{1FAD2}', 'Everyday Groceries'],
  'green-chilli': ['\u{1F336}\u{FE0F}', 'Everyday Groceries'],
};

const RECIPES = {
  'protein-egg-bowl': ['\u{1F373}', 'Protein'],
  'vegetable-rice-bowl': ['\u{1F35B}', 'Grains'],
  'paneer-wrap': ['\u{1F32F}', 'Protein'],
  'oats-banana-bowl': ['\u{1F963}', 'Grains'],
  'dal-khichdi': ['\u{1F35B}', 'Protein'],
  'greek-yogurt-fruit-bowl': ['\u{1F367}', 'Dairy'],
  'tomato-rice': ['\u{1F35A}', 'Grains'],
  'bread-omelette': ['\u{1F373}', 'Protein'],
  'egg-rice': ['\u{1F35A}', 'Protein'],
  'tofu-stir-fry-bowl': ['\u{1FAD8}', 'Fitness Foods'],
  'sprout-chaat': ['\u{1F331}', 'Protein'],
  'quinoa-veggie-salad': ['\u{1F957}', 'Vegetables'],
  'high-protein-smoothie': ['\u{1F964}', 'Fitness Foods'],
};

const BANNERS = {
  'banner-smart-grocery': ['\u{1F9FA}', 'Smart Grocery', '#1d3724', '#3f7f4e'],
  'banner-pantry': ['\u{1F3E0}', 'My Pantry', '#2f3a29', '#6d8758'],
  'banner-recipes': ['\u{1F373}', 'Recipes', '#0e1f14', '#3f7f4e'],
  'banner-meal-planner': ['\u{1F4C5}', 'Meal Planner', '#2f3a29', '#546b43'],
  'banner-for-you': ['\u{1F9ED}', 'For You', '#285231', '#8ba376'],
  'banner-alternatives': ['\u{1F501}', 'Healthy Alternatives', '#37442e', '#8fbd99'],
  'banner-nutrition': ['\u{1F4C8}', 'Purchased Nutrition', '#22422a', '#8fbd99'],
};

function escapeXml(value) {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** A soft, warm illustration tile with the food glyph large in the centre. */
function productSvg(glyph, label, category) {
  const [background, accent] = CATEGORY_TINTS[category] ?? DEFAULT_TINT;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="400" height="300" role="img" aria-label="${escapeXml(label)}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="${background}"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="42%" r="58%">
      <stop offset="0%" stop-color="${accent}" stop-opacity="0.34"/>
      <stop offset="100%" stop-color="${accent}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="400" height="300" fill="url(#bg)"/>
  <rect width="400" height="300" fill="url(#glow)"/>
  <circle cx="200" cy="140" r="86" fill="#ffffff" fill-opacity="0.55"/>
  <circle cx="200" cy="140" r="86" fill="none" stroke="${accent}" stroke-opacity="0.35" stroke-width="1.5"/>
  <text x="200" y="172" font-size="104" text-anchor="middle" font-family="Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif">${glyph}</text>
  <text x="200" y="256" font-size="16" font-weight="600" text-anchor="middle" fill="#2f3d35" font-family="Inter, system-ui, sans-serif">${escapeXml(label)}</text>
  <text x="200" y="276" font-size="11" text-anchor="middle" fill="#6d8758" font-family="Inter, system-ui, sans-serif">${escapeXml(category)}</text>
</svg>
`;
}

/** Wide banner artwork for the seven-slide feature banner. */
function bannerSvg(glyph, label, from, to) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 260" width="480" height="260" role="img" aria-label="${escapeXml(label)}">
  <defs>
    <linearGradient id="b" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${from}"/>
      <stop offset="100%" stop-color="${to}"/>
    </linearGradient>
  </defs>
  <rect width="480" height="260" fill="url(#b)"/>
  <circle cx="380" cy="60" r="120" fill="#ffffff" fill-opacity="0.08"/>
  <circle cx="120" cy="220" r="90" fill="#ffffff" fill-opacity="0.06"/>
  <text x="360" y="168" font-size="120" text-anchor="middle" font-family="Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif">${glyph}</text>
</svg>
`;
}

const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
  <rect width="32" height="32" rx="7" fill="#285231"/>
  <path d="M9 12h14l-1.4 10.6a2.2 2.2 0 0 1-2.2 1.9h-6.8a2.2 2.2 0 0 1-2.2-1.9L9 12Z" stroke="#faf7f0" stroke-width="1.7" fill="none" stroke-linejoin="round"/>
  <path d="M12.5 12V10a3.5 3.5 0 0 1 7 0v2" stroke="#faf7f0" stroke-width="1.7" fill="none" stroke-linecap="round"/>
  <path d="M16 16.2c2.4-2.6 4.5-2.4 4.9.6-.3 2.6-2.6 4-4.9 2.6-2.3 1.4-4.6 0-4.9-2.6.4-3 2.5-3.2 4.9-.6Z" fill="#8fbd99"/>
</svg>
`;

function write(relativePath, contents) {
  const target = resolve(publicDir, relativePath);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, contents, 'utf8');
}

let count = 0;
for (const [code, [glyph, category]] of Object.entries(PRODUCTS)) {
  const label = code.replace(/-/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase());
  write(`products/${code}.svg`, productSvg(glyph, label, category));
  count += 1;
}

for (const [code, [glyph, category]] of Object.entries(RECIPES)) {
  const label = code.replace(/-/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase());
  write(`recipes/${code}.svg`, productSvg(glyph, label, category));
  count += 1;
}

for (const [code, [glyph, label, from, to]] of Object.entries(BANNERS)) {
  write(`brand/${code}.svg`, bannerSvg(glyph, label, from, to));
  count += 1;
}

write('brand/favicon.svg', faviconSvg);
count += 1;

console.log(`NutriCart assets generated: ${count} files in ${publicDir}`);
