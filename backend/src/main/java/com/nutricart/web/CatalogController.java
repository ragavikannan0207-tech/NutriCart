package com.nutricart.web;

import com.nutricart.domain.Product;
import com.nutricart.domain.Recipe;
import com.nutricart.dto.Dtos;
import com.nutricart.service.CatalogueService;
import com.nutricart.service.DtoMapper;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Read-only catalogue endpoints.
 *
 * <p>The React client ships the same catalogue (one authored source, exported by
 * {@code npm run catalog}), so these endpoints exist for clients that prefer to read
 * the catalogue from MySQL — and they are what the seeder validates against.
 */
@RestController
@RequestMapping("/api")
public class CatalogController {

    private final CatalogueService catalogue;
    private final DtoMapper mapper;

    public CatalogController(CatalogueService catalogue, DtoMapper mapper) {
        this.catalogue = catalogue;
        this.mapper = mapper;
    }

    /**
     * Search + filter + sort in one call.
     *
     * @param q          case-insensitive partial match on name, category, tags, keywords
     * @param category   aisle label, e.g. "Fruits"
     * @param diet       "Vegetarian" | "Non-Vegetarian" | "No Restriction"
     * @param maxPrice   price ceiling in rupees
     * @param minProtein minimum protein per 100 g/ml
     * @param inStock    only products with stock left
     * @param sort       relevance | price-asc | price-desc | rating | newest
     */
    @GetMapping("/products")
    public List<Dtos.ProductDto> products(
            @RequestParam(name = "q", required = false) String q,
            @RequestParam(name = "category", required = false) String category,
            @RequestParam(name = "diet", required = false) String diet,
            @RequestParam(name = "maxPrice", required = false) Double maxPrice,
            @RequestParam(name = "minProtein", required = false) Double minProtein,
            @RequestParam(name = "inStock", required = false, defaultValue = "false") boolean inStock,
            @RequestParam(name = "sort", required = false, defaultValue = "relevance") String sort) {

        List<Product> results = catalogue.searchProducts(q);

        if (category != null && !category.isBlank() && !category.equalsIgnoreCase("all")) {
            var wanted = com.nutricart.domain.enums.EnumLabels.category(category);
            results = results.stream()
                    .filter(product -> product.getCategory() == wanted
                            || product.getSecondaryCategories().contains(wanted))
                    .toList();
        }
        if (diet != null && !diet.isBlank() && !diet.equalsIgnoreCase("all")) {
            var wanted = com.nutricart.domain.enums.EnumLabels.dietType(diet);
            results = results.stream().filter(product -> product.getDietType() == wanted).toList();
        }
        if (maxPrice != null) {
            results = results.stream().filter(product -> product.getPrice() <= maxPrice).toList();
        }
        if (minProtein != null) {
            results = results.stream().filter(product -> product.getProtein() >= minProtein).toList();
        }
        if (inStock) {
            results = results.stream().filter(product -> product.getStockCount() > 0).toList();
        }

        return catalogue.sort(results, sort).stream().map(mapper::product).toList();
    }

    @GetMapping("/products/{id}")
    public Dtos.ProductDto product(@PathVariable Long id) {
        return mapper.product(catalogue.requireProduct(id));
    }

    /** Related products from the same aisle. */
    @GetMapping("/products/{id}/related")
    public List<Dtos.ProductDto> related(@PathVariable Long id) {
        Product product = catalogue.requireProduct(id);
        return product.getRelatedCodes().stream()
                .map(catalogue::findProductByCode)
                .filter(java.util.Objects::nonNull)
                .map(mapper::product)
                .toList();
    }

    /** Genuinely healthier alternatives of a product. */
    @GetMapping("/products/{id}/alternatives")
    public List<Dtos.ProductDto> alternatives(@PathVariable Long id) {
        Product product = catalogue.requireProduct(id);
        return product.getAlternativeCodes().stream()
                .map(catalogue::findProductByCode)
                .filter(java.util.Objects::nonNull)
                .map(mapper::product)
                .toList();
    }

    @GetMapping("/recipes")
    public List<Dtos.RecipeDto> recipes(
            @RequestParam(name = "q", required = false) String q,
            @RequestParam(name = "mealSlot", required = false) String mealSlot,
            @RequestParam(name = "diet", required = false) String diet) {
        List<Recipe> results = catalogue.filterRecipes(catalogue.searchRecipes(q), mealSlot, diet);
        return results.stream().map(mapper::recipe).toList();
    }

    @GetMapping("/recipes/{id}")
    public Dtos.RecipeDto recipe(@PathVariable Long id) {
        return mapper.recipe(catalogue.requireRecipe(id));
    }

    /** Recipes that use a product — "Used in these recipes" on the detail page. */
    @GetMapping("/products/{id}/recipes")
    public List<Dtos.RecipeDto> recipesForProduct(@PathVariable Long id) {
        return catalogue.recipesUsingProduct(id).stream().map(mapper::recipe).toList();
    }
}