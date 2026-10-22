package com.nutricart.service;

import com.nutricart.domain.Product;
import java.time.LocalDate;
import java.util.Map;

/**
 * Freshness rules for the pantry.
 *
 * <p>Packaged goods carry a printed expiry date. Fresh produce in this catalogue has
 * no printed date, so its freshness is ESTIMATED from the product type and the
 * purchase date and is always labelled as an estimate in the UI.
 *
 * <p>Mirrors frontend/src/domain/pantry.ts (SHELF_LIFE_DAYS, DEFAULT_SHELF_LIFE_DAYS,
 * EXPIRING_SOON_DAYS) so the browser and the server agree on every date.
 */
public final class ShelfLife {

    private ShelfLife() {
    }

    /** Product code -> shelf life in days. */
    public static final Map<String, Integer> SHELF_LIFE_DAYS = Map.ofEntries(
            Map.entry("baby-spinach", 3),
            Map.entry("broccoli", 5),
            Map.entry("cucumber", 5),
            Map.entry("tomato", 5),
            Map.entry("capsicum", 6),
            Map.entry("green-chilli", 8),
            Map.entry("papaya", 4),
            Map.entry("watermelon", 5),
            Map.entry("banana", 5),
            Map.entry("hass-avocado", 4),
            Map.entry("sprouts", 3),
            Map.entry("curd", 4),
            Map.entry("buttermilk", 3),
            Map.entry("low-fat-milk", 4),
            Map.entry("protein-milkshake", 5),
            Map.entry("coconut-water", 6),
            Map.entry("paneer", 5),
            Map.entry("low-fat-paneer", 6),
            Map.entry("tofu", 6),
            Map.entry("greek-yogurt", 7),
            Map.entry("farm-fresh-eggs", 12),
            Map.entry("whole-wheat-bread", 5),
            Map.entry("multigrain-bread", 5),
            Map.entry("apple", 14),
            Map.entry("orange", 12),
            Map.entry("pomegranate", 12),
            Map.entry("kiwi", 8),
            Map.entry("sweet-potato", 18),
            Map.entry("beetroot", 14),
            Map.entry("carrot", 12),
            Map.entry("onion", 21),
            Map.entry("potato", 21));

    /** Anything without a specific shelf life keeps for a month. */
    public static final int DEFAULT_SHELF_LIFE_DAYS = 30;

    /** Items expiring within this many days are flagged "Expiring Soon". */
    public static final int EXPIRING_SOON_DAYS = 3;

    /** Estimated shelf life of a pantry entry, by catalogue code or by typed name. */
    public static int daysFor(Product product, String name) {
        if (product != null) {
            return SHELF_LIFE_DAYS.getOrDefault(product.getCode(), DEFAULT_SHELF_LIFE_DAYS);
        }
        if (name == null) {
            return DEFAULT_SHELF_LIFE_DAYS;
        }
        String slug = name.trim().toLowerCase().replaceAll("\\s+", "-");
        return SHELF_LIFE_DAYS.getOrDefault(slug, DEFAULT_SHELF_LIFE_DAYS);
    }

    /** Expiry date estimated from the purchase date when the pack has no printed date. */
    public static LocalDate estimatedExpiry(LocalDate purchaseDate, Product product, String name) {
        return purchaseDate.plusDays(daysFor(product, name));
    }
}