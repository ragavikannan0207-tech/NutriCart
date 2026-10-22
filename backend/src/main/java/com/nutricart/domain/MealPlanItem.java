package com.nutricart.domain;

import com.nutricart.domain.enums.DayOfWeek;
import com.nutricart.domain.enums.MealSlot;
import jakarta.persistence.*;

/** One planned meal inside a weekly meal plan. */
@Entity
@Table(name = "meal_plan_items", indexes = @Index(name = "idx_meal_plan_items_plan", columnList = "meal_plan_id"))
public class MealPlanItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "meal_plan_id", nullable = false, foreignKey = @ForeignKey(name = "fk_meal_plan_items_plan"))
    private MealPlan mealPlan;

    /**
     * Day of the week this meal is planned for.
     *
     * <p>The column is named {@code day_of_week} rather than {@code day} because
     * {@code DAY} is a reserved word in MySQL's and H2's SQL grammars — an unquoted
     * {@code day} column breaks DDL generation and inserts on strict engines. The API
     * still exposes the field as {@code day}, which is what the React client sends and
     * reads.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "day_of_week", nullable = false, length = 12)
    private DayOfWeek day;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 12)
    private MealSlot slot;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "recipe_id", nullable = false, foreignKey = @ForeignKey(name = "fk_meal_plan_items_recipe"))
    private Recipe recipe;

    @Column(nullable = false)
    private int servings;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public MealPlan getMealPlan() { return mealPlan; }
    public void setMealPlan(MealPlan mealPlan) { this.mealPlan = mealPlan; }
    public DayOfWeek getDay() { return day; }
    public void setDay(DayOfWeek day) { this.day = day; }
    public MealSlot getSlot() { return slot; }
    public void setSlot(MealSlot slot) { this.slot = slot; }
    public Recipe getRecipe() { return recipe; }
    public void setRecipe(Recipe recipe) { this.recipe = recipe; }
    public int getServings() { return servings; }
    public void setServings(int servings) { this.servings = servings; }
}
