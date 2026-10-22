package com.nutricart.domain.enums;

public enum DietType {
    VEGETARIAN("Vegetarian"),
    NON_VEGETARIAN("Non-Vegetarian"),
    NO_RESTRICTION("No Restriction");

    private final String label;

    DietType(String label) {
        this.label = label;
    }

    public String label() {
        return label;
    }
}
