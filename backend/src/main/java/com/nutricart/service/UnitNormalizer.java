package com.nutricart.service;

import com.nutricart.domain.Product;

/**
 * Unit handling shared by the pantry, recipe and meal-planner maths.
 *
 * <p>Python-free mirror of frontend/src/utils/units.ts: {@code g} and {@code ml}
 * are treated as equivalent weight units (1 ml ≈ 1 g), and anything sold by count
 * is normalised to {@code piece}. Because both sides run the same rules, a pantry
 * comparison made in the browser matches the one made by the server.
 */
public final class UnitNormalizer {

    private UnitNormalizer() {
    }

    public static final String GRAM = "g";
    public static final String MILLILITRE = "ml";
    public static final String PIECE = "piece";

    /** Default weight of one piece when the pack does not tell us. */
    private static final double DEFAULT_PIECE_GRAMS = 100;

    public record Normalised(double quantity, String unit) {
    }

    /** Average weight in grams of one piece for count-based products. */
    public static double pieceWeight(Product product) {
        if (product == null) {
            return DEFAULT_PIECE_GRAMS;
        }
        return product.getPackSize() > 0
                ? product.getPackGrams() / product.getPackSize()
                : DEFAULT_PIECE_GRAMS;
    }

    /** Converts any quantity/unit pair into the canonical g / ml / piece form. */
    public static Normalised normalise(double quantity, String unit, Product product) {
        String clean = unit == null ? "" : unit.trim().toLowerCase();
        if (clean.equals("piece") || clean.equals("pieces") || clean.equals("pcs") || clean.equals("nos")) {
            return new Normalised(quantity, PIECE);
        }
        double factor = massFactor(clean);
        if (factor > 0) {
            boolean liquid = clean.equals("ml") || clean.equals("l")
                    || clean.equals("litre") || clean.equals("liter");
            return new Normalised(quantity * factor, liquid ? MILLILITRE : GRAM);
        }
        // Unknown unit: fall back to grams, using the product's own unit when known.
        boolean liquidPack = product != null && MILLILITRE.equals(product.getPackUnit());
        return new Normalised(quantity, liquidPack ? MILLILITRE : GRAM);
    }

    /** Grams that a normalised quantity represents (pieces use the pack weight). */
    public static double toGrams(Normalised normalised, Product product) {
        if (PIECE.equals(normalised.unit())) {
            return normalised.quantity() * pieceWeight(product);
        }
        return normalised.quantity();
    }

    private static double massFactor(String unit) {
        return switch (unit) {
            case "g", "gm", "gram", "grams", MILLILITRE -> 1;
            case "kg", "l", "litre", "liter" -> 1000;
            default -> 0;
        };
    }
}