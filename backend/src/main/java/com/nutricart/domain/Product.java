package com.nutricart.domain;

import com.nutricart.domain.enums.Category;
import com.nutricart.domain.enums.DietType;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * A grocery product from the single centralised NutriCart catalogue.
 * The catalogue is authored once in the frontend (src/data/seed/*) and seeded into
 * MySQL from catalog/products.json, so the frontend and the database never diverge.
 *
 * <p>{@code code} is the stable slug used by the API and by the generated artwork.
 */
@Entity
@Table(name = "products", indexes = {
        @Index(name = "idx_products_code", columnList = "code", unique = true),
        @Index(name = "idx_products_category", columnList = "category")
})
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 80)
    private String code;

    @Column(nullable = false, length = 120)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private Category category;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "product_secondary_categories", joinColumns = @JoinColumn(name = "product_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "category", length = 32)
    private List<Category> secondaryCategories = new ArrayList<>();

    @Column(nullable = false)
    private double price;

    @Column(nullable = false)
    private double mrp;

    @Column(nullable = false, length = 60)
    private String unit;

    @Column(name = "pack_size", nullable = false)
    private double packSize;

    @Column(name = "pack_unit", nullable = false, length = 10)
    private String packUnit;

    @Column(name = "nutrition_basis", nullable = false, length = 40)
    private String nutritionBasis;

    @Column(name = "basis_amount", nullable = false)
    private double basisAmount;

    @Column(name = "pack_grams", nullable = false)
    private double packGrams;

    @Column(nullable = false, length = 700)
    private String description;

    @Column(nullable = false)
    private double rating;

    @Column(name = "review_count", nullable = false)
    private int reviewCount;

    @Column(nullable = false, length = 16)
    private String availability;

    @Column(name = "stock_count", nullable = false)
    private int stockCount;

    private double calories;
    private double protein;
    private double carbs;
    private double fat;
    private double fiber;

    @Enumerated(EnumType.STRING)
    @Column(name = "diet_type", nullable = false, length = 24)
    private DietType dietType = DietType.VEGETARIAN;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "product_tags", joinColumns = @JoinColumn(name = "product_id"))
    @Column(name = "tag", length = 60)
    private List<String> tags = new ArrayList<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "product_keywords", joinColumns = @JoinColumn(name = "product_id"))
    @Column(name = "keyword", length = 60)
    private List<String> keywords = new ArrayList<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "product_benefits", joinColumns = @JoinColumn(name = "product_id"))
    @Column(name = "benefit", length = 220)
    private List<String> healthyBenefits = new ArrayList<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "product_related", joinColumns = @JoinColumn(name = "product_id"))
    @Column(name = "related_code", length = 80)
    private List<String> relatedCodes = new ArrayList<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "product_alternatives", joinColumns = @JoinColumn(name = "product_id"))
    @Column(name = "alternative_code", length = 80)
    private List<String> alternativeCodes = new ArrayList<>();

    @Column(name = "is_new", nullable = false)
    private boolean isNew;

    @Column(name = "is_bestseller", nullable = false)
    private boolean isBestseller;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public Category getCategory() { return category; }
    public void setCategory(Category category) { this.category = category; }
    public List<Category> getSecondaryCategories() { return secondaryCategories; }
    public void setSecondaryCategories(List<Category> secondaryCategories) {
        this.secondaryCategories = MutableCollections.mutableCopyOf(secondaryCategories);
    }
    public double getPrice() { return price; }
    public void setPrice(double price) { this.price = price; }
    public double getMrp() { return mrp; }
    public void setMrp(double mrp) { this.mrp = mrp; }
    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }
    public double getPackSize() { return packSize; }
    public void setPackSize(double packSize) { this.packSize = packSize; }
    public String getPackUnit() { return packUnit; }
    public void setPackUnit(String packUnit) { this.packUnit = packUnit; }
    public String getNutritionBasis() { return nutritionBasis; }
    public void setNutritionBasis(String nutritionBasis) { this.nutritionBasis = nutritionBasis; }
    public double getBasisAmount() { return basisAmount; }
    public void setBasisAmount(double basisAmount) { this.basisAmount = basisAmount; }
    public double getPackGrams() { return packGrams; }
    public void setPackGrams(double packGrams) { this.packGrams = packGrams; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public double getRating() { return rating; }
    public void setRating(double rating) { this.rating = rating; }
    public int getReviewCount() { return reviewCount; }
    public void setReviewCount(int reviewCount) { this.reviewCount = reviewCount; }
    public String getAvailability() { return availability; }
    public void setAvailability(String availability) { this.availability = availability; }
    public int getStockCount() { return stockCount; }
    public void setStockCount(int stockCount) { this.stockCount = stockCount; }
    public double getCalories() { return calories; }
    public void setCalories(double calories) { this.calories = calories; }
    public double getProtein() { return protein; }
    public void setProtein(double protein) { this.protein = protein; }
    public double getCarbs() { return carbs; }
    public void setCarbs(double carbs) { this.carbs = carbs; }
    public double getFat() { return fat; }
    public void setFat(double fat) { this.fat = fat; }
    public double getFiber() { return fiber; }
    public void setFiber(double fiber) { this.fiber = fiber; }
    public DietType getDietType() { return dietType; }
    public void setDietType(DietType dietType) { this.dietType = dietType; }
    public List<String> getTags() { return tags; }
    public void setTags(List<String> tags) { this.tags = MutableCollections.mutableCopyOf(tags); }
    public List<String> getKeywords() { return keywords; }
    public void setKeywords(List<String> keywords) { this.keywords = MutableCollections.mutableCopyOf(keywords); }
    public List<String> getHealthyBenefits() { return healthyBenefits; }
    public void setHealthyBenefits(List<String> healthyBenefits) {
        this.healthyBenefits = MutableCollections.mutableCopyOf(healthyBenefits);
    }
    public List<String> getRelatedCodes() { return relatedCodes; }
    public void setRelatedCodes(List<String> relatedCodes) {
        this.relatedCodes = MutableCollections.mutableCopyOf(relatedCodes);
    }
    public List<String> getAlternativeCodes() { return alternativeCodes; }
    public void setAlternativeCodes(List<String> alternativeCodes) {
        this.alternativeCodes = MutableCollections.mutableCopyOf(alternativeCodes);
    }
    public boolean isNew() { return isNew; }
    public void setNew(boolean isNew) { this.isNew = isNew; }
    public boolean isBestseller() { return isBestseller; }
    public void setBestseller(boolean isBestseller) { this.isBestseller = isBestseller; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
