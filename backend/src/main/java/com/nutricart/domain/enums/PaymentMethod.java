package com.nutricart.domain.enums;

public enum PaymentMethod {
    COD("COD"),
    UPI("UPI"),
    CARD("Card");

    private final String label;

    PaymentMethod(String label) {
        this.label = label;
    }

    public String label() {
        return label;
    }
}
