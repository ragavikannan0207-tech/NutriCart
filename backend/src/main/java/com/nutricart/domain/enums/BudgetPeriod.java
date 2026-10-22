package com.nutricart.domain.enums;

public enum BudgetPeriod {
    WEEKLY("Weekly", 7),
    MONTHLY("Monthly", 30);

    private final String label;
    private final int days;

    BudgetPeriod(String label, int days) {
        this.label = label;
        this.days = days;
    }

    public String label() {
        return label;
    }

    public int days() {
        return days;
    }
}
