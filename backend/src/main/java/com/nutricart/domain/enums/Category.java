package com.nutricart.domain.enums;

/** Grocery aisles of the NutriCart catalogue. */
public enum Category {
    FRUITS("Fruits"),
    VEGETABLES("Vegetables"),
    PROTEIN("Protein"),
    GRAINS("Grains"),
    DAIRY("Dairy"),
    HEALTHY_SNACKS("Healthy Snacks"),
    FITNESS_FOODS("Fitness Foods"),
    DRINKS("Drinks"),
    EVERYDAY_GROCERIES("Everyday Groceries");

    private final String label;

    Category(String label) {
        this.label = label;
    }

    public String label() {
        return label;
    }
}
