package com.nutricart.domain.enums;

public enum MealSlot {
    BREAKFAST("Breakfast"),
    LUNCH("Lunch"),
    DINNER("Dinner");

    private final String label;

    MealSlot(String label) {
        this.label = label;
    }

    public String label() {
        return label;
    }
}
