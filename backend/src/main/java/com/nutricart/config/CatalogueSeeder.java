package com.nutricart.config;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nutricart.domain.Product;
import com.nutricart.domain.Recipe;
import com.nutricart.domain.RecipeIngredient;
import com.nutricart.domain.enums.Category;
import com.nutricart.domain.enums.DietType;
import com.nutricart.domain.enums.EnumLabels;
import com.nutricart.domain.enums.MealSlot;
import com.nutricart.repository.ProductRepository;
import com.nutricart.repository.RecipeRepository;
import java.io.InputStream;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Seeds the single NutriCart catalogue into MySQL on first start.
 *
 * <p>The catalogue is authored ONCE in the frontend (src/data/seed/*) and exported to
 * {@code catalog/products.json} + {@code catalog/recipes.json} by
 * {@code npm run catalog}. Seeding from that JSON means the React app and the
 * database can never disagree about a price, a nutrition value or a recipe.
 *
 * <p>Runs only when the tables are empty, so restarting the API never duplicates or
 * overwrites catalogue data.
 */
@Component
public class CatalogueSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(CatalogueSeeder.class);

    private static final String PRODUCTS_RESOURCE = "catalog/products.json";
    private static final String RECIPES_RESOURCE = "catalog/recipes.json";

    private final ProductRepository products;
    private final RecipeRepository recipes;
    private final ObjectMapper objectMapper;
    private final boolean enabled;

    public CatalogueSeeder(
            ProductRepository products,
            RecipeRepository recipes,
            ObjectMapper objectMapper,
            @Value("${nutricart.seed.catalogue:true}") boolean enabled) {
        this.products = products;
        this.recipes = recipes;
        this.objectMapper = objectMapper;
        this.enabled = enabled;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (!enabled) {
            log.info("Catalogue seeding disabled (nutricart.seed.catalogue=false)");
            return;
        }
        try {
            if (products.count() == 0) {
                int seeded = seedProducts();
                log.info("Seeded {} catalogue products into MySQL", seeded);
            }
            if (recipes.count() == 0) {
                int seeded = seedRecipes();
                log.info("Seeded {} recipes into MySQL", seeded);
            }
        } catch (Exception failure) {
            // A seeding problem must not stop the API from starting.
            log.warn("Catalogue seeding skipped: {}", failure.getMessage());
        }
    }

    private int seedProducts() throws Exception {
        JsonNode root = readResource(PRODUCTS_RESOURCE);
        List<Product> entities = new ArrayList<>();
        for (JsonNode node : root) {
            entities.add(toProduct(node));
        }
        products.saveAll(entities);
        return entities.size();
    }

    private Product toProduct(JsonNode node) {
        Product product = new Product();
        product.setCode(text(node, "code"));
        product.setName(text(node, "name"));
        product.setCategory(EnumLabels.category(text(node, "category")));

        List<Category> secondary = new ArrayList<>();
        node.path("secondaryCategories").forEach(entry -> secondary.add(EnumLabels.category(entry.asText())));
        product.setSecondaryCategories(secondary);

        product.setPrice(number(node, "price"));
        product.setMrp(number(node, "mrp"));
        product.setUnit(text(node, "unit"));
        product.setPackSize(number(node, "packSize"));
        product.setPackUnit(text(node, "packUnit"));
        product.setNutritionBasis(text(node, "nutritionBasis"));
        product.setBasisAmount(number(node, "basisAmount"));
        product.setPackGrams(number(node, "packGrams"));
        product.setDescription(text(node, "description"));
        product.setRating(number(node, "rating"));
        product.setReviewCount((int) number(node, "reviewCount"));
        product.setAvailability(text(node, "availability"));
        product.setStockCount((int) number(node, "stockCount"));
        product.setCalories(number(node, "calories"));
        product.setProtein(number(node, "protein"));
        product.setCarbs(number(node, "carbs"));
        product.setFat(number(node, "fat"));
        product.setFiber(number(node, "fiber"));
        product.setDietType(EnumLabels.dietType(text(node, "dietType")));
        product.setTags(textList(node, "tags"));
        product.setKeywords(textList(node, "keywords"));
        product.setHealthyBenefits(textList(node, "healthyBenefits"));
        product.setRelatedCodes(textList(node, "relatedCodes"));
        product.setAlternativeCodes(textList(node, "alternativeCodes"));
        product.setNew(node.path("isNew").asBoolean(false));
        product.setBestseller(node.path("isBestseller").asBoolean(false));

        String createdAt = text(node, "createdAt");
        product.setCreatedAt(createdAt.isEmpty() ? Instant.now() : Instant.parse(createdAt));
        return product;
    }

    private int seedRecipes() throws Exception {
        JsonNode root = readResource(RECIPES_RESOURCE);

        Map<String, Product> byCode = new HashMap<>();
        products.findAll().forEach(product -> byCode.put(product.getCode(), product));

        List<Recipe> entities = new ArrayList<>();
        for (JsonNode node : root) {
            entities.add(toRecipe(node, byCode));
        }
        recipes.saveAll(entities);
        return entities.size();
    }

    private Recipe toRecipe(JsonNode node, Map<String, Product> byCode) {
        Recipe recipe = new Recipe();
        recipe.setCode(text(node, "code"));
        recipe.setName(text(node, "name"));
        recipe.setDescription(text(node, "description"));
        recipe.setPrepTimeMinutes((int) number(node, "prepTimeMinutes"));
        recipe.setCookTimeMinutes((int) number(node, "cookTimeMinutes"));
        recipe.setServings((int) Math.max(1, number(node, "servings")));
        recipe.setDietType(EnumLabels.dietType(text(node, "dietType")));

        List<MealSlot> slots = new ArrayList<>();
        node.path("mealSlots").forEach(entry -> slots.add(EnumLabels.mealSlot(entry.asText())));
        recipe.setMealSlots(slots);

        recipe.setTags(textList(node, "tags"));
        recipe.setSteps(textList(node, "steps"));
        recipe.setSwapCodes(textList(node, "swapCodes"));

        List<RecipeIngredient> ingredients = new ArrayList<>();
        for (JsonNode entry : node.path("ingredients")) {
            Product product = byCode.get(entry.path("productCode").asText());
            if (product == null) {
                continue;
            }
            RecipeIngredient ingredient = new RecipeIngredient();
            ingredient.setRecipe(recipe);
            ingredient.setProduct(product);
            ingredient.setQuantity(number(entry, "quantity"));
            ingredient.setUnit(text(entry, "unit"));
            ingredient.setNormalisedQuantity(number(entry, "normalisedQuantity"));
            ingredient.setNormalisedUnit(text(entry, "normalisedUnit"));
            ingredient.setOptional(entry.path("optional").asBoolean(false));
            ingredient.setNote(text(entry, "note"));
            ingredients.add(ingredient);
        }
        recipe.setIngredients(ingredients);

        // Recipe nutrition is taken from the exported catalogue, which computes it
        // from the real ingredient values — never hand-written.
        recipe.setCalories(number(node, "calories"));
        recipe.setProtein(number(node, "protein"));
        recipe.setCarbs(number(node, "carbs"));
        recipe.setFat(number(node, "fat"));
        recipe.setFiber(number(node, "fiber"));
        recipe.setCreatedAt(Instant.now());
        return recipe;
    }

    private JsonNode readResource(String path) throws Exception {
        try (InputStream stream = new ClassPathResource(path).getInputStream()) {
            return objectMapper.readTree(stream);
        }
    }

    private String text(JsonNode node, String field) {
        JsonNode value = node.path(field);
        return value.isMissingNode() || value.isNull() ? "" : value.asText("");
    }

    private double number(JsonNode node, String field) {
        JsonNode value = node.path(field);
        return value.isMissingNode() || value.isNull() ? 0d : value.asDouble(0d);
    }

    private List<String> textList(JsonNode node, String field) {
        List<String> values = new ArrayList<>();
        node.path(field).forEach(entry -> {
            if (!entry.asText("").isBlank()) {
                values.add(entry.asText());
            }
        });
        return values;
    }
}
