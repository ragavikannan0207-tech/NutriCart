package com.nutricart.domain.enums;

public enum HealthGoal {
    WEIGHT_LOSS("Weight Loss", -0.18, 1.6),
    WEIGHT_GAIN("Weight Gain", 0.15, 1.6),
    MUSCLE_GAIN("Muscle Gain", 0.10, 2.0),
    MAINTAIN_WEIGHT("Maintain Weight", 0.0, 1.2),
    GENERAL_HEALTHY_EATING("General Healthy Eating", 0.0, 1.1);

    private final String label;
    private final double calorieAdjustment;
    private final double proteinPerKg;

    HealthGoal(String label, double calorieAdjustment, double proteinPerKg) {
        this.label = label;
        this.calorieAdjustment = calorieAdjustment;
        this.proteinPerKg = proteinPerKg;
    }

    public String label() {
        return label;
    }

    public double calorieAdjustment() {
        return calorieAdjustment;
    }

    public double proteinPerKg() {
        return proteinPerKg;
    }
}
