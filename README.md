# NutriCart — Smart Grocery and Healthy Food Recommendation System

**Shop Smart. Eat Healthy.**

NutriCart is a full-stack grocery e-commerce platform with a real nutrition and pantry
intelligence layer on top of it. It is a shopping application first — browse, search,
cart, checkout, order, track, cancel, invoice — and every one of those steps is
connected to the person you are shopping for.

---

## 1. Verified status

| Area | State |
|---|---|
| Frontend (React + TypeScript + Vite + Tailwind) | ✅ builds clean — `npm run build` (tsc + vite) passes |
| Backend (Java 17+ / Spring Boot 3.3) | ✅ `mvn package` passes, executable jar produced |
| Backend tests | ✅ **25 tests** (3 suites) — `mvn test` green |
| Frontend tests | ✅ **35 tests** (4 suites) — `npm run test` green |
| Database | ✅ MySQL schema (`database/schema.sql`, 28 tables) + automatic catalogue seeding |
| Live API | ✅ exercised end-to-end (health → register → profile → cart → order → tracking → cancel → invoice) |

Exactly what was executed is recorded in [§11 Verification](#11-verification).

---

## 2. What it is

A grocery store where the storefront reacts to **who you are shopping for**:

* one account holds **many person profiles** (Ragavi, Mother, Father, Brother…)
* the active person drives recommendations, pantry maths, recipes, meal plans, budgets
  and the nutrition report
* the cart, wishlist and order history stay **global** — one cart, one wishlist, one
  order list, no matter which page added to it

### The smart layer on top of the shop

| Feature | What it actually does |
|---|---|
| **Smart Grocery** | Builds a budget-aware basket from people × duration × diet × goal × pantry. ₹250 and ₹2,500 never produce the same list, and the basket can never exceed the budget. |
| **My Pantry** | Real kitchen inventory (never the cart). Printed expiry for packaged goods; freshness **estimated and labelled** for unpackaged produce. Expired items are never deleted automatically. |
| **Recipes** | 13 recipes whose nutrition is **computed** from the catalogue values of their ingredients. Each recipe is compared with your pantry, and only the missing quantities can be pushed to the cart. |
| **Meal Planner** | Weekly breakfast/lunch/dinner calendar. “Add this week to cart” aggregates every planned meal, merges duplicates, subtracts pantry stock and adds only the remainder. |
| **For You** | Personalised rails built **only** from real activity (orders, pantry, wishlist, diet, goal, allergies, preferences, budget). With no history it says so instead of inventing purchases. |
| **Purchased Nutrition** | Calories / protein / carbs / fat / fibre contained in the groceries you **bought**, derived from confirmed orders. Deliberately *not* called “consumed nutrition”. |
| **Budget** | Weekly or monthly budget **per person**; spend comes from non-cancelled orders only. An order that pushes the period past the limit raises a genuine Budget Warning notification. |
| **Healthy Alternatives** | Search-driven swaps (white bread → whole wheat, soft drink → coconut water, chips → roasted makhana → protein chips…) mapped to real catalogue products, each with the nutrition win explained. |
| **Notifications** | Only real events: order confirmed, out for delivery, delivered, cancelled, pantry expiring, weekly plan ready, budget warning. |
| **Help Center** | Searchable FAQ across 8 topics plus a real `mailto:` hand-off to support (nothing is sent behind your back). |
| **Diet & Workout service** | A separate paid service page (30-day ₹1,500 / 6-month ₹7,500). It is **not** a grocery product and can never enter the cart. |

---

## 3. Architecture

```
React + TypeScript + Vite + Tailwind
              │  (one service layer, two interchangeable implementations)
              ▼
   Java Spring Boot REST API  ──►  Controller → Service → Repository → Entity (+ DTOs)
              ▼
     Spring Data JPA / Hibernate
              ▼
            MySQL
```

### One frontend, two data layers

`frontend/src/services/contracts.ts` defines the **entire** persistence surface of the
application. It is implemented twice:

| Implementation | When it is used |
|---|---|
| `services/http/*` → Spring Boot REST API + MySQL | whenever the API answers `GET /api/health` |
| `services/local/*` → browser persistence (a real small database, not a mock) | when the API is unreachable, so the UI is never dead |

`VITE_DATA_MODE=auto` (default) probes the backend on boot; `api` forces Spring Boot and
`local` forces the browser layer. **No page or component knows which one is active** —
they only ever talk to the contracts.

Logic the UI needs instantly (cart totals, tracking timeline, pantry freshness, recipe
comparison, recommendations) lives once in `frontend/src/domain/*` and is mirrored by the
backend (`PricingService`, `OrderService`, `ShelfLife`, `UnitNormalizer`), so the browser
and MySQL cannot disagree about money or nutrition.

### One catalogue, authored once

Products and recipes are authored in `frontend/src/data/seed/*` and exported to JSON for
the backend:

```bash
cd frontend && npm run catalog   # → backend/src/main/resources/catalog/{products,recipes}.json
```

`CatalogueSeeder` loads those files into MySQL when the tables are empty, so there is no
second copy of a price, a nutrition value or a recipe step anywhere in the project.

The specification lists 63 catalogue slots; seven repeat a product from another aisle
(Protein Oats, High Protein Peanut Butter, Low Fat Paneer, Tofu, Soy Chunks,
High/Protein Granola, Greek Yogurt). Those are stored as **one SKU tagged with a second
category**, so 63 slots = **56 unique products** with zero duplicate rows. The mapping is
documented in `frontend/src/data/seed/types.ts`.

---

## 4. Tech stack

**Frontend** React 18 · TypeScript 5 (strict, `noUnusedLocals`) · Vite 5 · Tailwind CSS 3 ·
React Router 6 · lucide-react · route-level code splitting

**Backend** Java 17+ · Spring Boot 3.3 · Spring Web · Spring Data JPA / Hibernate ·
Bean Validation · Spring Security (BCrypt + JWT) · Maven

**Database** MySQL 8 (InnoDB, utf8mb4) — explicit DDL in `database/schema.sql`

**Commerce rules, implemented identically on both sides**

| Rule | Value |
|---|---|
| Free delivery | subtotal ≥ ₹499, otherwise ₹39 |
| GST | 5% on the discounted subtotal |
| Quantity discounts | 5% off ≥ ₹1,500 · 8% off ≥ ₹2,500 |
| Delivery promise | 10–20 minutes |
| Cancellation window | **60 seconds**, measured from the stored order timestamp |
| Card storage | masked reference only (“Card ending 1234”) — never a full PAN or CVV |

---

## 5. Repository layout

```
NUTRICART/
├── frontend/                     React + TS + Vite + Tailwind application
│   ├── src/
│   │   ├── services/             persistence contracts + HTTP (Spring Boot) + local (browser) implementations
│   │   ├── components/           UI kit, layout shell, product cards, orders, profile
│   │   ├── data/                 THE catalogue + recipes (authored here, seeded into MySQL)
│   │   ├── domain/               pricing, order lifecycle, pantry, nutrition, recommendations
│   │   ├── hooks/ state/         reusable hooks + the single global app store
│   │   ├── pages/                every screen (auth/, shop/, account/ + feature pages)
│   │   ├── types/ utils/         shared types, formatting, units, validation, storage
│   │   └── layouts/
│   ├── public/                   generated artwork: 56 products, 13 recipes, 7 banners, favicon
│   └── scripts/                  generate-assets.mjs, export-catalog.mjs
├── backend/                      Spring Boot REST API
│   ├── src/main/java/com/nutricart/
│   │   ├── config/               SecurityConfig, OrderProperties, OrderLifecycleJob, CatalogueSeeder
│   │   ├── domain/               16 JPA entities + enums + EnumLabels/EnumParsing
│   │   ├── dto/                  Dtos + ShoppingDtos (records)
│   │   ├── exception/            ApiException + GlobalExceptionHandler
│   │   ├── repository/           13 Spring Data repositories
│   │   ├── security/             JwtService, JwtAuthenticationFilter, CurrentUser
│   │   ├── service/              15 services (see §8)
│   │   └── web/                  13 REST controllers
│   ├── src/main/resources/       application.yml + catalog/{products,recipes}.json
│   └── src/test/                 unit + full-stack integration tests (H2 profile)
├── database/schema.sql           MySQL DDL: 28 tables, foreign keys, indexes, constraints
└── README.md
```

---

## 6. Quick start

### 6.1 Prerequisites

* Node 18+ and npm
* Java 17+ (built and verified on JDK 25)
* Maven 3.9+ (`brew install maven`, or any `mvn` on your PATH)
* MySQL 8+ running locally

### 6.2 Database

```bash
mysql -u root -p -e "CREATE DATABASE nutricart CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

Optional — only if you want the DDL applied explicitly instead of by Hibernate:

```bash
mysql -u root -p < database/schema.sql
```

### 6.3 Backend

```bash
cd backend
mvn spring-boot:run
```

Connection settings (all overridable through environment variables — see
`backend/src/main/resources/application.yml`):

| Variable | Default |
|---|---|
| `NUTRICART_DB_URL` | `jdbc:mysql://localhost:3306/nutricart?createDatabaseIfNotExist=true...` |
| `NUTRICART_DB_USER` | **required** (no default) |
| `NUTRICART_DB_PASSWORD` | **required** (no default) |
| `NUTRICART_JWT_SECRET` | **required** (no default; at least 32 bytes for HS256) |
| `NUTRICART_JWT_MINUTES` | `1440` |
| `NUTRICART_CORS_ORIGINS` | `http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174` |

For local development, copy `backend/.env.example` to `backend/.env` and adjust if needed;
`.env` is gitignored and must never be committed. In production, provide these
variables through your deployment environment.

On first start the app creates the schema (if needed) and seeds **56 products** and
**13 recipes** from `src/main/resources/catalog/*.json`.

```bash
curl http://localhost:8080/api/health          # {"status":"UP",...}
```

### 6.4 Frontend

```bash
cd frontend
npm install
npm run build            # assets + catalogue export + typecheck + production build
npm run dev              # http://localhost:5173
```

The dev server proxies `/api` → `http://localhost:8080`, so the browser talks to the
same origin and no CORS configuration is needed during development.

| Script | What it does |
|---|---|
| `npm run dev` | Vite dev server with `/api` proxy |
| `npm run build` | regenerates artwork (prebuild) → type-checks → bundles |
| `npm run typecheck` | `tsc --noEmit` only |
| `npm run test` | 35 vitest unit tests over the domain rules |
| `npm run test:watch` | vitest in watch mode |
| `npm run assets` | regenerates the 77 SVG artwork files |
| `npm run catalog` | re-exports `products.json` / `recipes.json` for the backend — run it after **any** seed edit |

### 6.5 Which data layer is active?

`VITE_DATA_MODE` (default `auto`) probes `GET /api/health` on boot:

* **UP** → the app runs entirely on Spring Boot + MySQL
* **unreachable** → the app runs on its built-in browser persistence layer using the
  same contracts, and the header shows a “Local mode” badge

Set `VITE_DATA_MODE=api` to require the backend, or `local` for an offline demo.

---

## 7. REST API

Base URL `http://localhost:8080/api` · JSON in / JSON out · enum values travel as
**display labels** (`"Vegetarian"`, `"Fruits"`, `"Out for Delivery"`), never enum
constant names, so the contract matches the TypeScript types exactly.

### Public

| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | liveness probe used by the frontend data-layer switch |
| POST | `/auth/register` | create account → `{token, user}` |
| POST | `/auth/login` | sign in → `{token, user}` |
| GET | `/products` | search (`q`), filter (`category`, `diet`, `maxPrice`, `minProtein`, `inStock`), `sort` |
| GET | `/products/{id}` · `/related` · `/alternatives` · `/recipes` | product detail data |
| GET | `/recipes` · `/recipes/{id}` | recipe list (filters `q`, `mealSlot`, `diet`) and detail |

### Authenticated (Bearer token)

| Group | Endpoints |
|---|---|
| Session | `GET /auth/session` · `POST /auth/logout` · `PUT /users/me` |
| Preferences | `GET/PUT /preferences` · `POST /preferences/pantry-review` |
| Profiles | `GET /profiles` · `POST /profiles` · `PUT/DELETE /profiles/{id}` · `POST /profiles/{id}/activate` |
| Addresses | `GET /addresses` · `POST /addresses` · `PUT/DELETE /addresses/{id}` · `POST /addresses/{id}/default` |
| Cart | `GET /cart` · `PUT /cart/items/{productId}` · `POST /cart/items/{productId}/increment` · `DELETE /cart/items/{productId}` · `DELETE /cart` · `POST /cart/merge` |
| Wishlist | `GET /wishlist` · `POST /wishlist/{productId}` · `DELETE /wishlist/{productId}` · `POST /wishlist/{productId}/toggle` |
| Orders | `GET /orders` · `GET /orders/{id}` · `POST /orders` · `POST /orders/{id}/cancel` · `POST /orders/sync` |
| Pantry | `GET /pantry?personProfileId=` · `POST /pantry` · `PUT/DELETE /pantry/{id}` · `POST /pantry/{id}/adjust` |
| Meal plans | `GET /meal-plans?weekStart=` · `POST /meal-plans/items` · `PUT/DELETE /meal-plans/items/{id}` |
| Budget | `GET /budget?personProfileId=` (404 when unset) · `PUT /budget` |
| Notifications | `GET /notifications` · `POST /notifications` · `POST /notifications/{id}/read` · `POST /notifications/read-all` · `DELETE /notifications/{id}` |

### Errors

`GlobalExceptionHandler` returns `{timestamp, status, message, fieldErrors}` with the
right HTTP status (400 validation with per-field messages, 401 missing/expired token,
403 forbidden, 404 not found, 409 duplicate email). Stack traces are logged, never sent
to the client.

---

## 8. Data model

28 tables (`database/schema.sql`); the most important relationships:

```
users ──┬── 1:N person_profiles ──┬── N:1 orders          (person reference is detachable)
        │                         ├── 1:N pantry_items
        │                         ├── 1:N meal_plans ── 1:N meal_plan_items ── N:1 recipes
        │                         └── 1:1 budgets
        ├── 1:1 user_preferences
        ├── 1:N addresses                       (orders keep their own snapshot)
        ├── 1:N cart_items    ── N:1 products
        ├── 1:N wishlist_items── N:1 products
        ├── 1:N orders ── 1:N order_items ── N:1 products
        └── 1:N notifications

products ── 1:N product_{tags,keywords,benefits,related,alternatives,secondary_categories}
recipes  ── 1:N recipe_{ingredients,meal_slots,tags,steps,swaps}
```

Design decisions worth knowing:

* **`orders.person_profile_id` is nullable.** Deleting a person detaches their orders
  instead of destroying order history, invoices and purchased-nutrition records; the
  order keeps its own name, address, price and nutrition snapshot.
* **`orders.order_number` is unique but nullable at insert.** The reference
  (`NC-<yyyyMMdd>-<id>`) is filled from the row id inside the same transaction, so two
  simultaneous checkouts can never collide.
* **`meal_plan_items.day_of_week`** — `DAY` is a reserved word in MySQL/H2 grammars.
* **No card data is modelled at all** — only `payment_reference` (a masked string).
* Element-collection tables hold tags/keywords/steps/allergies; everything else is a
  normal keyed row with an index where the query pattern needs one.

---

## 9. Feature map

| Screen(s) | What it does |
|---|---|
| Login / Register / Profile Setup | first screen is Login (no public shop); validation mirrors the API; new accounts always continue into profile setup |
| AppShell | one reusable shell: logo, global search, notifications/wishlist/cart badges, “Shopping for …” selector, desktop sidebar, scrollable mobile drawer |
| Overview | grocery discovery home (not a dashboard): greeting, 7-slide feature banner, quick actions, shop-by-category, personalised rails, pantry alerts, recent order |
| Shop Groceries | live search across name/category/tags/keywords, category chips, filters (diet, price, protein, calories, availability), 5 sorts, real availability |
| Product Details | breadcrumb, image, nutrition (basis + per pack), benefits, healthy alternatives, related products, “used in these recipes”, quantity → Add to Cart / Buy Now / Wishlist |
| Cart / Checkout | one global cart; totals (subtotal → discount → delivery → GST); address + person + items + payment (COD/UPI/Card, validated) + review + place order |
| Orders / Tracking / Invoice | history, live timeline, **60 s cancel window**, reorder, print/PDF invoice with purchased-nutrition totals |
| My Pantry | CRUD + quantity stepper, printed vs **estimated** freshness labels, expiring/expired filters, “cook from what you have” |
| Recipes / Meal Planner | 13 recipes with computed nutrition, pantry comparison, “add missing ingredients”; weekly calendar with merged + pantry-subtracted shopping list |
| Smart Grocery | people × duration × budget × diet × goal × pantry → basket that can never exceed the budget |
| For You | rails built only from real activity; empty state says “start shopping…” |
| Purchased Nutrition | purchased (not consumed) nutrition per period, per person, against calculated targets |
| Budget | per-person weekly/monthly budget, spend from real orders only, category split, real budget warnings |
| Healthy Alternatives | dynamic search → curated swaps + catalogue matches + healthier choices, each with a nutrition win |
| Notifications / Help / Diet plans / Settings | real events only · searchable FAQ + `mailto:` support · non-grocery service page that cannot enter the cart · full settings persistence |

**Global data rules:** one catalogue (authored once, seeded into MySQL), one cart, one
wishlist, one order system, one active person. Every module that adds something to the cart
goes through `POST /cart/merge`, so Shop, Product Details, Wishlist, Recipes, Pantry, Meal
Planner, Smart Grocery, For You and Healthy Alternatives all land in the same cart — and
placing an order empties it while updating Orders, tracking, Budget, Purchased Nutrition,
Overview and For You.

**No fake data:** Purchased Nutrition, Budget spend, Buy Again, recommendations and every
statistic are computed from the account's real orders/pantry/wishlist. With no history the
pages show an explicit empty state instead of inventing numbers, cancelled orders are
excluded from every total, and recipe nutrition is derived from ingredient values.

---

## 10. Security

* **Passwords** — BCrypt (`$2a$10$`, cost 10). Verified directly in MySQL: every stored
  hash starts with `$2a$10$` and zero rows contain the plain password.
* **Tokens** — HS256 JWT (24 h, overridable), stateless; every protected endpoint resolves
  the caller through `CurrentUser.id()`, so account A cannot read, modify or cancel
  account B's data. Verified live: cross-account order read → 404, cancel → 404,
  forged token → 401.
* **Authorization** — anonymous → `401` JSON (with a friendly message the React client
  understands as “session expired”), authenticated-but-not-allowed → `403` JSON.
* **Card data** — only a masked reference is persisted (`Card ending 1234`, `UPI <id>`).
  There is no PAN or CVV column in the model at all, and a live query confirmed zero rows
  contain a full card number.
* **SQL injection** — every statement goes through JPA parameter binding; no string-built SQL.
* **Secrets** — database credentials, JWT secret and CORS origins are environment
  variables (`NUTRICART_*`), never committed defaults meant for production.
* **Secrets never leak** — the API returns tokens and hashes are never serialised into DTOs.

---

## 11. Verification

Everything below was executed in this workspace.

### Automated tests — `mvn test`

```
Tests run: 25, Failures: 0, Errors: 0, Skipped: 0 — BUILD SUCCESS

  PricingServiceTest               7 tests  delivery, GST, discount tiers, nutrition maths
  UnitNormalizerAndShelfLifeTest   8 tests  g / ml / piece normalisation, shelf life, estimates
  NutriCartApiIntegrationTest     10 tests  full HTTP journey over the real Spring context
```

The integration test boots the actual application (security filter chain, controllers,
services, JPA, catalogue seeder) against H2 and covers: catalogue seeding, `401` without a
token, registration validation + duplicate email + wrong password, active-profile
switching, the global cart (set / increment / merge / quantity-zero), order placement with
pricing maths and cart emptying, cancellation inside the window, cancellation refused after
60 seconds, the concurrent-checkout numbering race, and the pantry / meal-plan / budget /
preferences / wishlist round trip.

### Live run against MySQL 9.5 (`java -jar`, port 8080)

| Check | Result |
|---|---|
| Application start + schema creation | ✅ `Started NutriCartApplication in 3.4 s`, 28 tables |
| Catalogue seeding from `catalog/*.json` | ✅ 56 products, 13 recipes |
| `GET /api/health`, also through the Vite proxy `:5173/api/health` | ✅ `UP` |
| Register · duplicate `409` · login · wrong password `401` · bad email `400` | ✅ |
| Search `q=chips` · `category=Protein&diet=Vegetarian` · `minProtein=20` sorted | ✅ correct |
| Profile create (age 0 → `400` + field error) · active switching (exactly one active) | ✅ |
| Address validation (invalid pincode → `400`) | ✅ |
| Cart set → increment → merge (unknown id skipped) → order → cart `[]` | ✅ |
| Order maths: subtotal 988 · delivery 0 (≥499) · GST 49.40 · total **1037.40** | ✅ |
| Order `NC-20261005-0001` · `Confirmed` · ETA +20 min · nutrition computed | ✅ |
| Cancel **inside** 60 s → `Cancelled` + notification | ✅ |
| Cancel **after 65 s** → `400 “Orders can only be cancelled within 60 seconds”` | ✅ |
| Lifecycle job advanced a live order `Confirmed → Processing` | ✅ |
| Cross-account order read / cancel → `404` · forged token → `401` | ✅ |
| Pantry create with **estimated** expiry flag → adjust → auto-remove at zero | ✅ |
| Meal plan week / add / update / remove, scoped to the active person | ✅ |
| Budget per person (other person → `404`) · preferences round trip · wishlist toggle | ✅ |
| Notifications list / create / mark read / read-all | ✅ |
| MySQL: all password hashes `$2a$10$`, 0 rows containing the plaintext password | ✅ |
| MySQL: 0 rows containing a full card number / CVV | ✅ |

### Frontend

| Check | Result |
|---|---|
| `npm run typecheck` (strict + `noUnusedLocals`) | ✅ 0 errors |
| `npm run build` (assets → typecheck → bundle) | ✅ |
| `npm run test` (vitest) | ✅ **35 tests, 4 files** |
| `npm run catalog` (export backend JSON) | ✅ 56 products, 13 recipes |
| Dev server + `/api` proxy → Spring Boot → MySQL | ✅ `UP`, search works through the proxy |

Frontend tests cover the same rules the backend enforces, so the two sides cannot drift:
`pricing.test.ts` (7) — tiers, delivery, GST, and **the exact basket that was placed
against MySQL (₹988 / ₹49.40 / ₹1,037.40)**; `orders.test.ts` (7) — tracking timeline and
progress; `cancellation.test.ts` (9) — the 60-second window measured from `createdAt`;
`pantry.test.ts` (12) — freshness states, shelf life, recipe-vs-pantry shortfall maths.

**Bug found and fixed by this suite:** `addDays()` built a local midnight and read
`toISOString()`, which shifted the result a day earlier in timezones ahead of UTC — so a
pantry expiry estimate in browser-storage mode would have been one day off. It is now pure
UTC calendar arithmetic, matching `LocalDate.plusDays` in the Java backend.


### Known warnings (non-blocking)

* The **5 warnings are JDK 25 runtime warnings from Maven itself** (`jansi` restricted
  native access, `guava` `sun.misc.Unsafe`) — not project defects.
* Maven 3.9.9 was installed at `~/tools/apache-maven-3.9.9` because no `mvn` was on PATH.

### Next steps for production

1. Copy `backend/.env.example` to `backend/.env` (or set `NUTRICART_DB_*` / `NUTRICART_JWT_SECRET` in your deployment environment) and point it at your MySQL instance.
2. Set a strong, unique `NUTRICART_JWT_SECRET` and tighten `NUTRICART_CORS_ORIGINS`.
3. Serve `frontend/dist` statically and drop the Vite proxy.
4. Optional: version the schema with Flyway instead of `ddl-auto=update`.

