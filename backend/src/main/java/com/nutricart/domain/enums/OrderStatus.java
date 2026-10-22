package com.nutricart.domain.enums;

public enum OrderStatus {
    CONFIRMED("Confirmed", 0),
    PROCESSING("Processing", 2),
    PACKED("Packed", 5),
    OUT_FOR_DELIVERY("Out for Delivery", 8),
    DELIVERED("Delivered", 15),
    CANCELLED("Cancelled", -1);

    private final String label;
    private final int minuteOffset;

    OrderStatus(String label, int minuteOffset) {
        this.label = label;
        this.minuteOffset = minuteOffset;
    }

    public String label() {
        return label;
    }

    /** Minutes after placement at which this status is reached (-1 for Cancelled). */
    public int minuteOffset() {
        return minuteOffset;
    }

    public boolean isFinal() {
        return this == DELIVERED || this == CANCELLED;
    }
}
