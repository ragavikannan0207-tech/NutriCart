package com.nutricart.domain;

import jakarta.persistence.*;

/**
 * One ingredient line of a recipe, resolved to a catalogue product.
 * Normalised quantities (g / ml / piece) make pantry comparison exact.
 */
@Entity
@Table(name = "recipe_ingredients", indexes = @Index(name = "idx_recipe_ingredients_recipe", columnList = "recipe_id"))
public class RecipeIngredient {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "recipe_id", nullable = false, foreignKey = @ForeignKey(name = "fk_recipe_ingredients_recipe"))
    private Recipe recipe;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "product_id", nullable = false, foreignKey = @ForeignKey(name = "fk_recipe_ingredients_product"))
    private Product product;

    @Column(nullable = false)
    private double quantity;

    @Column(nullable = false, length = 12)
    private String unit;

    @Column(name = "normalised_quantity", nullable = false)
    private double normalisedQuantity;

    @Column(name = "normalised_unit", nullable = false, length = 8)
    private String normalisedUnit;

    @Column(nullable = false)
    private boolean optional;

    @Column(length = 200)
    private String note = "";

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Recipe getRecipe() { return recipe; }
    public void setRecipe(Recipe recipe) { this.recipe = recipe; }
    public Product getProduct() { return product; }
    public void setProduct(Product product) { this.product = product; }
    public double getQuantity() { return quantity; }
    public void setQuantity(double quantity) { this.quantity = quantity; }
    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }
    public double getNormalisedQuantity() { return normalisedQuantity; }
    public void setNormalisedQuantity(double normalisedQuantity) { this.normalisedQuantity = normalisedQuantity; }
    public String getNormalisedUnit() { return normalisedUnit; }
    public void setNormalisedUnit(String normalisedUnit) { this.normalisedUnit = normalisedUnit; }
    public boolean isOptional() { return optional; }
    public void setOptional(boolean optional) { this.optional = optional; }
    public String getNote() { return note; }
    public void setNote(String note) { this.note = note == null ? "" : note; }
}
