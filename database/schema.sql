-- =============================================================================
-- NutriCart — MySQL schema
-- =============================================================================
-- This file is the explicit, reviewable DDL for the NutriCart database.
--
-- It matches the JPA entities in backend/src/main/java/com/nutricart/domain
-- one-to-one. You do NOT have to run it: `spring.jpa.hibernate.ddl-auto=update`
-- (see backend/src/main/resources/application.yml) creates the same schema on the
-- first start against an empty database, which is the quickest way to run the
-- project. Run this file when you want the schema created explicitly, or when you
-- are reviewing the data model.
--
--   mysql -u root -p < database/schema.sql
--
-- Design notes
--   * InnoDB + utf8mb4 everywhere.
--   * Element-collection tables hold tags / keywords / steps / allergies.
--   * orders.person_profile_id is NULLABLE on purpose: deleting a person profile
--     detaches their orders instead of destroying order history, invoices and
--     purchased-nutrition records. The order keeps its own name, address, price and
--     nutrition snapshot, so a historic order always renders correctly.
--   * Card numbers and CVVs are never modelled — only a masked reference string.
-- =============================================================================

CREATE DATABASE IF NOT EXISTS nutricart
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE nutricart;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS notifications, budgets, meal_plan_items, meal_plans, pantry_items,
    order_items, orders, wishlist_items, cart_items, recipe_swaps, recipe_steps,
    recipe_tags, recipe_meal_slots, recipe_ingredients, recipes,
    product_alternatives, product_related, product_benefits, product_keywords,
    product_tags, product_secondary_categories, products, addresses,
    profile_preferences, profile_allergies, person_profiles, user_preferences, users;
SET FOREIGN_KEY_CHECKS = 1;

-- -----------------------------------------------------------------------------
-- Accounts
-- -----------------------------------------------------------------------------
CREATE TABLE users (
  id            BIGINT       NOT NULL AUTO_INCREMENT,
  full_name     VARCHAR(120) NOT NULL,
  email         VARCHAR(190) NOT NULL,
  password_hash VARCHAR(120) NOT NULL,          -- BCrypt only, never plaintext
  created_at    DATETIME(6)  NOT NULL,
  updated_at    DATETIME(6)  NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE user_preferences (
  id                     BIGINT      NOT NULL AUTO_INCREMENT,
  user_id                BIGINT      NOT NULL,
  notify_order_updates   BIT(1)      NOT NULL DEFAULT b'1',
  notify_pantry_expiry   BIT(1)      NOT NULL DEFAULT b'1',
  notify_budget_alerts   BIT(1)      NOT NULL DEFAULT b'1',
  notify_recommendations BIT(1)      NOT NULL DEFAULT b'1',
  notify_weekly_plan     BIT(1)      NOT NULL DEFAULT b'1',
  nutrition_period       VARCHAR(12) NOT NULL DEFAULT 'Weekly',
  default_pantry_unit    VARCHAR(8)  NOT NULL DEFAULT 'g',
  meal_preference        VARCHAR(24) NOT NULL DEFAULT 'Balanced',
  measurement_system     VARCHAR(12) NOT NULL DEFAULT 'Metric',
  currency               VARCHAR(6)  NOT NULL DEFAULT 'INR',
  last_pantry_review     DATE        NULL,
  updated_at             DATETIME(6) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_preferences_user (user_id),
  CONSTRAINT fk_preferences_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Person profiles — one account, many people
-- -----------------------------------------------------------------------------
CREATE TABLE person_profiles (
  id             BIGINT       NOT NULL AUTO_INCREMENT,
  user_id        BIGINT       NOT NULL,
  name           VARCHAR(80)  NOT NULL,
  age            INT          NOT NULL,
  gender         VARCHAR(24)  NOT NULL,
  height_cm      DOUBLE       NOT NULL,
  weight_kg      DOUBLE       NOT NULL,
  activity_level VARCHAR(32)  NOT NULL,
  diet_type      VARCHAR(24)  NOT NULL,
  health_goal    VARCHAR(32)  NOT NULL,
  budget_amount  DOUBLE       NOT NULL DEFAULT 2500,
  budget_period  VARCHAR(16)  NOT NULL DEFAULT 'WEEKLY',
  is_active      BIT(1)       NOT NULL DEFAULT b'0',
  created_at     DATETIME(6)  NOT NULL,
  updated_at     DATETIME(6)  NOT NULL,
  PRIMARY KEY (id),
  KEY idx_profiles_user (user_id),
  KEY idx_profiles_active (user_id, is_active),
  CONSTRAINT fk_profiles_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE profile_allergies (
  profile_id BIGINT      NOT NULL,
  allergy    VARCHAR(60) NULL,
  KEY idx_profile_allergies (profile_id),
  CONSTRAINT fk_profile_allergies FOREIGN KEY (profile_id) REFERENCES person_profiles (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE profile_preferences (
  profile_id BIGINT      NOT NULL,
  preference VARCHAR(60) NULL,
  KEY idx_profile_preferences (profile_id),
  CONSTRAINT fk_profile_preferences FOREIGN KEY (profile_id) REFERENCES person_profiles (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Addresses (orders keep their own snapshot, so editing never rewrites history)
-- -----------------------------------------------------------------------------
CREATE TABLE addresses (
  id             BIGINT       NOT NULL AUTO_INCREMENT,
  user_id        BIGINT       NOT NULL,
  label          VARCHAR(40)  NOT NULL DEFAULT 'Home',
  recipient_name VARCHAR(120) NOT NULL,
  phone          VARCHAR(15)  NOT NULL,
  line1          VARCHAR(180) NOT NULL,
  line2          VARCHAR(180) NULL,
  city           VARCHAR(80)  NOT NULL,
  state          VARCHAR(80)  NOT NULL,
  pincode        VARCHAR(6)   NOT NULL,
  is_default     BIT(1)       NOT NULL DEFAULT b'0',
  created_at     DATETIME(6)  NOT NULL,
  PRIMARY KEY (id),
  KEY idx_addresses_user (user_id),
  KEY idx_addresses_default (user_id, is_default),
  CONSTRAINT fk_addresses_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Products — the single centralised catalogue (56 SKUs / 63 listed slots)
-- Seeded from backend/src/main/resources/catalog/products.json, which is exported
-- from the frontend seed data by `npm run catalog`.
-- -----------------------------------------------------------------------------
CREATE TABLE products (
  id                  BIGINT       NOT NULL AUTO_INCREMENT,
  code                VARCHAR(80)  NOT NULL,
  name                VARCHAR(120) NOT NULL,
  category            VARCHAR(32)  NOT NULL,
  price               DOUBLE       NOT NULL,
  mrp                 DOUBLE       NOT NULL,
  unit                VARCHAR(60)  NOT NULL,
  pack_size           DOUBLE       NOT NULL,
  pack_unit           VARCHAR(10)  NOT NULL,
  nutrition_basis     VARCHAR(40)  NOT NULL,
  basis_amount        DOUBLE       NOT NULL,
  pack_grams          DOUBLE       NOT NULL,
  description         VARCHAR(700) NOT NULL,
  rating              DOUBLE       NOT NULL,
  review_count        INT          NOT NULL,
  availability        VARCHAR(16)  NOT NULL,
  stock_count         INT          NOT NULL,
  calories            DOUBLE       NOT NULL DEFAULT 0,
  protein             DOUBLE       NOT NULL DEFAULT 0,
  carbs               DOUBLE       NOT NULL DEFAULT 0,
  fat                 DOUBLE       NOT NULL DEFAULT 0,
  fiber               DOUBLE       NOT NULL DEFAULT 0,
  diet_type           VARCHAR(24)  NOT NULL,
  is_new              BIT(1)       NOT NULL DEFAULT b'0',
  is_bestseller       BIT(1)       NOT NULL DEFAULT b'0',
  created_at          DATETIME(6)  NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY idx_products_code (code),
  KEY idx_products_category (category),
  KEY idx_products_price (price),
  KEY idx_products_protein (protein),
  FULLTEXT KEY ft_products_search (name, description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE product_secondary_categories (
  product_id BIGINT      NOT NULL,
  category   VARCHAR(32) NULL,
  KEY idx_psc_product (product_id),
  CONSTRAINT fk_psc_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE product_tags (
  product_id BIGINT      NOT NULL,
  tag        VARCHAR(60) NULL,
  KEY idx_product_tags (product_id),
  KEY idx_product_tags_value (tag),
  CONSTRAINT fk_product_tags FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE product_keywords (
  product_id BIGINT      NOT NULL,
  keyword    VARCHAR(60) NULL,
  KEY idx_product_keywords (product_id),
  KEY idx_product_keywords_value (keyword),
  CONSTRAINT fk_product_keywords FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE product_benefits (
  product_id BIGINT       NOT NULL,
  benefit    VARCHAR(220) NULL,
  KEY idx_product_benefits (product_id),
  CONSTRAINT fk_product_benefits FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE product_related (
  product_id   BIGINT      NOT NULL,
  related_code VARCHAR(80) NULL,
  KEY idx_product_related (product_id),
  CONSTRAINT fk_product_related FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Genuinely healthier swaps shown by "Healthy Alternatives"
CREATE TABLE product_alternatives (
  product_id       BIGINT      NOT NULL,
  alternative_code VARCHAR(80) NULL,
  KEY idx_product_alternatives (product_id),
  CONSTRAINT fk_product_alternatives FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Recipes (13 healthy recipes, nutrition computed from ingredient values)
-- -----------------------------------------------------------------------------
CREATE TABLE recipes (
  id                 BIGINT       NOT NULL AUTO_INCREMENT,
  code               VARCHAR(80)  NOT NULL,
  name               VARCHAR(140) NOT NULL,
  description        VARCHAR(500) NOT NULL,
  prep_time_minutes  INT          NOT NULL,
  cook_time_minutes  INT          NOT NULL,
  servings           INT          NOT NULL,
  diet_type          VARCHAR(24)  NOT NULL,
  calories           DOUBLE       NOT NULL DEFAULT 0,
  protein            DOUBLE       NOT NULL DEFAULT 0,
  carbs              DOUBLE       NOT NULL DEFAULT 0,
  fat                DOUBLE       NOT NULL DEFAULT 0,
  fiber              DOUBLE       NOT NULL DEFAULT 0,
  created_at         DATETIME(6)  NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY idx_recipes_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE recipe_meal_slots (
  recipe_id BIGINT      NOT NULL,
  meal_slot VARCHAR(16) NULL,
  KEY idx_recipe_meal_slots (recipe_id),
  CONSTRAINT fk_recipe_meal_slots FOREIGN KEY (recipe_id) REFERENCES recipes (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE recipe_tags (
  recipe_id BIGINT      NOT NULL,
  tag       VARCHAR(60) NULL,
  KEY idx_recipe_tags (recipe_id),
  CONSTRAINT fk_recipe_tags FOREIGN KEY (recipe_id) REFERENCES recipes (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE recipe_steps (
  recipe_id  BIGINT       NOT NULL,
  step_index INT          NOT NULL DEFAULT 0,
  step       VARCHAR(400) NULL,
  KEY idx_recipe_steps (recipe_id),
  CONSTRAINT fk_recipe_steps FOREIGN KEY (recipe_id) REFERENCES recipes (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE recipe_swaps (
  recipe_id BIGINT      NOT NULL,
  swap_code VARCHAR(80) NULL,
  KEY idx_recipe_swaps (recipe_id),
  CONSTRAINT fk_recipe_swaps FOREIGN KEY (recipe_id) REFERENCES recipes (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Ingredient lines, normalised to g / ml / piece so the pantry comparison is exact
CREATE TABLE recipe_ingredients (
  id                  BIGINT      NOT NULL AUTO_INCREMENT,
  recipe_id           BIGINT      NOT NULL,
  product_id          BIGINT      NOT NULL,
  quantity            DOUBLE      NOT NULL,
  unit                VARCHAR(12) NOT NULL,
  normalised_quantity DOUBLE      NOT NULL,
  normalised_unit     VARCHAR(8)  NOT NULL,
  optional            BIT(1)      NOT NULL DEFAULT b'0',
  note                VARCHAR(200) NULL,
  PRIMARY KEY (id),
  KEY idx_recipe_ingredients_recipe (recipe_id),
  KEY idx_recipe_ingredients_product (product_id),
  CONSTRAINT fk_recipe_ingredients_recipe FOREIGN KEY (recipe_id) REFERENCES recipes (id) ON DELETE CASCADE,
  CONSTRAINT fk_recipe_ingredients_product FOREIGN KEY (product_id) REFERENCES products (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- The ONE global cart and the wishlist
-- -----------------------------------------------------------------------------
CREATE TABLE cart_items (
  id         BIGINT      NOT NULL AUTO_INCREMENT,
  user_id    BIGINT      NOT NULL,
  product_id BIGINT      NOT NULL,
  quantity   INT         NOT NULL,
  unit_price DOUBLE      NOT NULL,
  added_at   DATETIME(6) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_cart_user_product (user_id, product_id),
  KEY idx_cart_user (user_id),
  CONSTRAINT fk_cart_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_cart_product FOREIGN KEY (product_id) REFERENCES products (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE wishlist_items (
  id         BIGINT      NOT NULL AUTO_INCREMENT,
  user_id    BIGINT      NOT NULL,
  product_id BIGINT      NOT NULL,
  added_at   DATETIME(6) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_wishlist_user_product (user_id, product_id),
  KEY idx_wishlist_user (user_id),
  CONSTRAINT fk_wishlist_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_wishlist_product FOREIGN KEY (product_id) REFERENCES products (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Orders — an immutable snapshot of what was bought, for whom, at which price
-- orders.person_profile_id is NULLABLE and has no cascade: ProfileService detaches
-- the order (person = NULL) before a person is deleted, so order history, invoices
-- and purchased-nutrition records survive. Everything else on the order is a copy,
-- which is why a historic order always renders correctly.
-- -----------------------------------------------------------------------------
CREATE TABLE orders (
  id                   BIGINT       NOT NULL AUTO_INCREMENT,
  -- order_number is UNIQUE and NOT NULL for readers, but nullable at insert time:
  -- OrderService fills it from the id the database assigns, so two simultaneous
  -- checkouts can never collide on the same reference.
  order_number         VARCHAR(32)  NULL,
  user_id              BIGINT       NOT NULL,
  person_profile_id    BIGINT       NULL,
  person_name          VARCHAR(80)  NOT NULL,
  customer_name        VARCHAR(120) NOT NULL,
  address_label        VARCHAR(40)  NOT NULL,
  address_recipient    VARCHAR(120) NOT NULL,
  address_phone        VARCHAR(15)  NOT NULL,
  address_line1        VARCHAR(180) NOT NULL,
  address_line2        VARCHAR(180) NULL,
  address_city         VARCHAR(80)  NOT NULL,
  address_state        VARCHAR(80)  NOT NULL,
  address_pincode      VARCHAR(6)   NOT NULL,
  subtotal             DOUBLE       NOT NULL,
  delivery             DOUBLE       NOT NULL,
  tax                  DOUBLE       NOT NULL,
  discount             DOUBLE       NOT NULL,
  grand_total          DOUBLE       NOT NULL,
  payment_method       VARCHAR(12)  NOT NULL DEFAULT 'COD',
  payment_reference    VARCHAR(60)  NOT NULL DEFAULT '',
  status               VARCHAR(20)  NOT NULL DEFAULT 'CONFIRMED',
  nutrition_calories   DOUBLE       NOT NULL,
  nutrition_protein    DOUBLE       NOT NULL,
  nutrition_carbs      DOUBLE       NOT NULL,
  nutrition_fat        DOUBLE       NOT NULL,
  nutrition_fiber      DOUBLE       NOT NULL,
  created_at           DATETIME(6)  NOT NULL,
  updated_at           DATETIME(6)  NOT NULL,
  estimated_delivery_at DATETIME(6) NOT NULL,
  delivered_at         DATETIME(6)  NULL,
  cancelled_at         DATETIME(6)  NULL,
  notes                VARCHAR(300) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY idx_orders_number (order_number),
  KEY idx_orders_user (user_id),
  KEY idx_orders_status (status),
  CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users (id),
  CONSTRAINT fk_orders_profile FOREIGN KEY (person_profile_id) REFERENCES person_profiles (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE order_items (
  id           BIGINT       NOT NULL AUTO_INCREMENT,
  order_id     BIGINT       NOT NULL,
  product_id   BIGINT       NOT NULL,
  product_code VARCHAR(80)  NOT NULL,
  product_name VARCHAR(120) NOT NULL,
  unit         VARCHAR(60)  NOT NULL,
  category     VARCHAR(32)  NOT NULL,
  unit_price   DOUBLE       NOT NULL,
  quantity     INT          NOT NULL,
  line_total   DOUBLE       NOT NULL,
  calories     DOUBLE       NOT NULL,
  protein      DOUBLE       NOT NULL,
  carbs        DOUBLE       NOT NULL,
  fat          DOUBLE       NOT NULL,
  fiber        DOUBLE       NOT NULL,
  PRIMARY KEY (id),
  KEY idx_order_items_order (order_id),
  KEY idx_order_items_product (product_id),
  CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE,
  CONSTRAINT fk_order_items_product FOREIGN KEY (product_id) REFERENCES products (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- My Pantry — the kitchen inventory (never the cart)
-- person_profile_id is a plain column: PantryService removes a person's rows when
-- that person is deleted, and expired items are never deleted automatically.
-- -----------------------------------------------------------------------------
CREATE TABLE pantry_items (
  id                  BIGINT       NOT NULL AUTO_INCREMENT,
  user_id             BIGINT       NOT NULL,
  person_profile_id   BIGINT       NOT NULL,
  product_id          BIGINT       NULL,
  name                VARCHAR(120) NOT NULL,
  category            VARCHAR(32)  NOT NULL,
  quantity            DOUBLE       NOT NULL,
  unit                VARCHAR(12)  NOT NULL,
  normalised_quantity DOUBLE       NOT NULL,
  normalised_unit     VARCHAR(8)   NOT NULL,
  purchase_date       DATE         NOT NULL,
  expiry_date         DATE         NOT NULL,
  expiry_estimated    BIT(1)       NOT NULL DEFAULT b'0',
  notes               VARCHAR(300) NULL,
  created_at          DATETIME(6)  NOT NULL,
  updated_at          DATETIME(6)  NOT NULL,
  PRIMARY KEY (id),
  KEY idx_pantry_user (user_id),
  KEY idx_pantry_expiry (expiry_date),
  KEY idx_pantry_product (product_id),
  CONSTRAINT fk_pantry_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_pantry_product FOREIGN KEY (product_id) REFERENCES products (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Weekly meal planner — one plan per user + week + person
-- -----------------------------------------------------------------------------
CREATE TABLE meal_plans (
  id                BIGINT      NOT NULL AUTO_INCREMENT,
  user_id           BIGINT      NOT NULL,
  person_profile_id BIGINT      NOT NULL,
  week_start        DATE        NOT NULL,
  created_at        DATETIME(6) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_meal_plan_user_week_person (user_id, week_start, person_profile_id),
  KEY idx_meal_plans_user (user_id),
  CONSTRAINT fk_meal_plans_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE meal_plan_items (
  id           BIGINT NOT NULL AUTO_INCREMENT,
  meal_plan_id BIGINT NOT NULL,
  recipe_id    BIGINT NOT NULL,
  -- day_of_week rather than `day`: DAY is a reserved word in MySQL/H2 grammars.
  day_of_week  VARCHAR(12) NOT NULL,
  slot         VARCHAR(12) NOT NULL,
  servings     INT    NOT NULL,
  PRIMARY KEY (id),
  KEY idx_meal_plan_items_plan (meal_plan_id),
  KEY idx_meal_plan_items_recipe (recipe_id),
  CONSTRAINT fk_meal_plan_items_plan FOREIGN KEY (meal_plan_id) REFERENCES meal_plans (id) ON DELETE CASCADE,
  CONSTRAINT fk_meal_plan_items_recipe FOREIGN KEY (recipe_id) REFERENCES recipes (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Grocery budget per person (the amount is a setting; spend comes from orders)
-- -----------------------------------------------------------------------------
CREATE TABLE budgets (
  id                BIGINT      NOT NULL AUTO_INCREMENT,
  user_id           BIGINT      NOT NULL,
  person_profile_id BIGINT      NOT NULL,
  period            VARCHAR(12) NOT NULL DEFAULT 'WEEKLY',
  amount            DOUBLE      NOT NULL,
  updated_at        DATETIME(6) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_budget_person (user_id, person_profile_id),
  KEY idx_budgets_user (user_id),
  CONSTRAINT fk_budgets_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Notifications raised by real events (order progress, expiry, budget, plans)
-- -----------------------------------------------------------------------------
CREATE TABLE notifications (
  id                BIGINT       NOT NULL AUTO_INCREMENT,
  user_id           BIGINT       NOT NULL,
  person_profile_id BIGINT       NULL,
  type              VARCHAR(32)  NOT NULL DEFAULT 'SYSTEM',
  title             VARCHAR(140) NOT NULL,
  message           VARCHAR(400) NOT NULL,
  action_path       VARCHAR(120) NOT NULL DEFAULT '/overview',
  is_important      BIT(1)       NOT NULL DEFAULT b'0',
  is_read           BIT(1)       NOT NULL DEFAULT b'0',
  created_at        DATETIME(6)  NOT NULL,
  PRIMARY KEY (id),
  KEY idx_notifications_user (user_id),
  KEY idx_notifications_created (created_at),
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

