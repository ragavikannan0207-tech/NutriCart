package com.nutricart.domain.enums;

public enum ActivityLevel {
    SEDENTARY("Sedentary", 1.2),
    LIGHTLY_ACTIVE("Lightly Active", 1.375),
    MODERATELY_ACTIVE("Moderately Active", 1.55),
    VERY_ACTIVE("Very Active", 1.725);

    private final String label;
    private final double factor;

    ActivityLevel(String label, double factor) {
        this.label = label;
        this.factor = factor;
    }

    public String label() {
        return label;
    }

    public double factor() {
        return factor;
    }
}
