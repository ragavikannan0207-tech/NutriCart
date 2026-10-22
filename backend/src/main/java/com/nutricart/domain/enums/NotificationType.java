package com.nutricart.domain.enums;

public enum NotificationType {
    ORDER_CONFIRMED("Order Confirmed", true),
    OUT_FOR_DELIVERY("Out for Delivery", true),
    DELIVERED("Delivered", true),
    CANCELLED("Cancelled", true),
    PANTRY_EXPIRING("Pantry Expiring", true),
    WEEKLY_PLAN_READY("Weekly Plan Ready", false),
    BUDGET_WARNING("Budget Warning", true),
    RECOMMENDATION("Recommendation", false),
    SYSTEM("System", false);

    private final String label;
    private final boolean important;

    NotificationType(String label, boolean important) {
        this.label = label;
        this.important = important;
    }

    public String label() {
        return label;
    }

    public boolean important() {
        return important;
    }
}
