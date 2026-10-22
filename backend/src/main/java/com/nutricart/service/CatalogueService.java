package com.nutricart.service;

import com.nutricart.domain.Product;
import com.nutricart.domain.Recipe;
import com.nutricart.domain.enums.Category;
import com.nutricart.domain.enums.DietType;
import com.nutricart.exception.ApiException;
import com.nutricart.repository.ProductRepository;
import com.nutricart.repository.RecipeRepository;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Read access to the grocery / recipe catalogue and the single place that turns a
 * product id or code into an entity.
 *
 * <p>The catalogue itself is authored in the frontend and seeded into MySQL by
 * {@link CatalogueSeeder}; every other service depends on this class rather than on
 * the repositories directly, so "what does this product id mean" is answered in
 * exactly one way.
 */
@Service
public class CatalogueService {

    private final ProductRepository products;
    private final RecipeRepository recipes;

    public CatalogueService(ProductRepository products, RecipeRepository recipes) {
        this.products = products;
        this.recipes = recipes;
    }

    /* ------------------------------------------------------------ PRODUCTS -- */

    @Transactional(readOnly = true)
    public List<Product> products() {
        return products.findAllByOrderByIdAsc();
    }

    @Transactional(readOnly = true)
    public Product findProduct(Long id) {
        return id == null ? null : products.findById(id).orElse(null);
    }

    /** A product the request referred to, or a 404 the React client can display. */
    @Transactional(readOnly = true)
    public Product requireProduct(Long id) {
        Product product = findProduct(id);
        if (product == null) {
            throw ApiException.notFound("That product is no longer in the catalogue.");
        }
        return product;
    }

    @Transactional(readOnly = true)
    public Product findProductByCode(String code) {
        return code == null ? null : products.findByCode(code).orElse(null);
    }

    @Transactional(readOnly = true)
    public Product requireProductByCode(String code) {
        Product product = findProductByCode(code);
        if (product == null) {
            throw ApiException.notFound("We could not find that product.");
        }
        return product;
    }

    /**
     * Case-insensitive, partial, multi-token search across name, category, tags and
     * keywords — the same fields the Shop page searches in the browser.
     */
    @Transactional(readOnly = true)
    public List<Product> searchProducts(String query) {
        String term = query == null ? "" : query.trim();
        if (term.isEmpty()) {
            return products();
        }
        return products.search(term);
    }

    @Transactional(readOnly = true)
    public List<Product> productsByCategory(Category category) {
        return products.findByCategory(category, PageRequest.of(0, 500)).getContent();
    }

    /** Sorts a product listing for the Shop page (price, rating, name, newest). */
    public List<Product> sort(List<Product> source, String sortKey) {
        String key = sortKey == null ? "" : sortKey.trim().toLowerCase(Locale.ROOT);
        Comparator<Product> comparator = switch (key) {
            case "price-low-high", "price-asc" -> Comparator.comparingDouble(Product::getPrice);
            case "price-high-low", "price-desc" -> Comparator.comparingDouble(Product::getPrice).reversed();
            case "rating" -> Comparator.comparingDouble(Product::getRating).reversed();
            case "name", "name-a-z" -> Comparator.comparing(Product::getName, String.CASE_INSENSITIVE_ORDER);
            case "newest" -> Comparator.comparing(Product::getCreatedAt).reversed();
            default -> null;
        };
        return comparator == null ? source : source.stream().sorted(comparator).toList();
    }

    /* -------------------------------------------------------------- RECIPES -- */

    @Transactional(readOnly = true)
    public List<Recipe> recipes() {
        return recipes.findAllByOrderByIdAsc();
    }

    @Transactional(readOnly = true)
    public Recipe findRecipe(Long id) {
        return id == null ? null : recipes.findById(id).orElse(null);
    }

    /** A recipe the request referred to, or a 404 the React client can display. */
    @Transactional(readOnly = true)
    public Recipe requireRecipe(Long id) {
        Recipe recipe = findRecipe(id);
        if (recipe == null) {
            throw ApiException.notFound("That recipe is not part of the NutriCart collection.");
        }
        return recipe;
    }

    @Transactional(readOnly = true)
    public Recipe findRecipeByCode(String code) {
        return code == null ? null : recipes.findByCode(code).orElse(null);
    }

    /** Case-insensitive search across recipe name, description and tags. */
    @Transactional(readOnly = true)
    public List<Recipe> searchRecipes(String query) {
        String term = query == null ? "" : query.trim();
        if (term.isEmpty()) {
            return recipes();
        }
        return recipes.search(term);
    }

    /**
     * Recipes that can be cooked with a given product — used by the product detail
     * page ("Used in these recipes").
     */
    @Transactional(readOnly = true)
    public List<Recipe> recipesUsingProduct(Long productId) {
        if (productId == null) {
            return List.of();
        }
        return recipes().stream()
                .filter(recipe -> recipe.getIngredients().stream()
                        .anyMatch(ingredient -> ingredient.getProduct().getId().equals(productId)))
                .toList();
    }

    /** Filters a recipe listing by meal slot and diet exactly like the Recipes page. */
    public List<Recipe> filterRecipes(List<Recipe> source, String mealSlot, String dietType) {
        String slot = mealSlot == null ? "" : mealSlot.trim().toLowerCase(Locale.ROOT);
        String diet = dietType == null ? "" : dietType.trim().toLowerCase(Locale.ROOT);
        return source.stream()
                .filter(recipe -> slot.isEmpty()
                        || recipe.getMealSlots().stream().anyMatch(value -> value.label().toLowerCase(Locale.ROOT).equals(slot)))
                .filter(recipe -> diet.isEmpty() || diet.equals("all")
                        || recipe.getDietType().label().toLowerCase(Locale.ROOT).equals(diet))
                .toList();
    }

    /* ---------------------------------------------------------------- DIET -- */

    /** True when a product fits the diet a person profile follows. */
    public boolean isDietCompatible(Product product, DietType diet) {
        if (diet == DietType.VEGETARIAN) {
            return product.getDietType() == DietType.VEGETARIAN;
        }
        return true; // Non-Vegetarian and No Restriction shoppers can buy everything
    }
}