package com.nutricart.domain;

import com.nutricart.domain.enums.DietType;
import com.nutricart.domain.enums.MealSlot;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * A cookable recipe. Nutrition is computed from the real catalogue values of the
 * ingredients (never hand-written) by CatalogueService.
 */
@Entity
@Table(name = "recipes", indexes = @Index(name = "idx_recipes_code", columnList = "code", unique = true))
public class Recipe {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 80)
    private String code;

    @Column(nullable = false, length = 140)
    private String name;

    @Column(nullable = false, length = 500)
    private String description;

    @Column(name = "prep_time_minutes", nullable = false)
    private int prepTimeMinutes;

    @Column(name = "cook_time_minutes", nullable = false)
    private int cookTimeMinutes;

    @Column(nullable = false)
    private int servings;

    @Enumerated(EnumType.STRING)
    @Column(name = "diet_type", nullable = false, length = 24)
    private DietType dietType = DietType.VEGETARIAN;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "recipe_meal_slots", joinColumns = @JoinColumn(name = "recipe_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "meal_slot", length = 16)
    private List<MealSlot> mealSlots = new ArrayList<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "recipe_tags", joinColumns = @JoinColumn(name = "recipe_id"))
    @Column(name = "tag", length = 60)
    private List<String> tags = new ArrayList<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "recipe_steps", joinColumns = @JoinColumn(name = "recipe_id"))
    @Column(name = "step", length = 400)
    @OrderColumn(name = "step_index")
    private List<String> steps = new ArrayList<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "recipe_swaps", joinColumns = @JoinColumn(name = "recipe_id"))
    @Column(name = "swap_code", length = 80)
    private List<String> swapCodes = new ArrayList<>();

    @OneToMany(mappedBy = "recipe", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @OrderBy("id ASC")
    private List<RecipeIngredient> ingredients = new ArrayList<>();

    private double calories;
    private double protein;
    private double carbs;
    private double fat;
    private double fiber;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public int getPrepTimeMinutes() { return prepTimeMinutes; }
    public void setPrepTimeMinutes(int prepTimeMinutes) { this.prepTimeMinutes = prepTimeMinutes; }
    public int getCookTimeMinutes() { return cookTimeMinutes; }
    public void setCookTimeMinutes(int cookTimeMinutes) { this.cookTimeMinutes = cookTimeMinutes; }
    public int getServings() { return servings; }
    public void setServings(int servings) { this.servings = servings; }
    public DietType getDietType() { return dietType; }
    public void setDietType(DietType dietType) { this.dietType = dietType; }
    public List<MealSlot> getMealSlots() { return mealSlots; }
    public void setMealSlots(List<MealSlot> mealSlots) { this.mealSlots = MutableCollections.mutableCopyOf(mealSlots); }
    public List<String> getTags() { return tags; }
    public void setTags(List<String> tags) { this.tags = MutableCollections.mutableCopyOf(tags); }
    public List<String> getSteps() { return steps; }
    public void setSteps(List<String> steps) { this.steps = MutableCollections.mutableCopyOf(steps); }
    public List<String> getSwapCodes() { return swapCodes; }
    public void setSwapCodes(List<String> swapCodes) { this.swapCodes = MutableCollections.mutableCopyOf(swapCodes); }
    public List<RecipeIngredient> getIngredients() { return ingredients; }
    public void setIngredients(List<RecipeIngredient> ingredients) {
        this.ingredients = MutableCollections.mutableCopyOf(ingredients);
    }
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
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
