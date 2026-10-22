package com.nutricart.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.nutricart.domain.Product;
import com.nutricart.domain.enums.ActivityLevel;
import java.time.LocalDate;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * Unit handling and pantry freshness.
 * These rules make recipe/pantry comparison exact, and they mirror
 * frontend/src/utils/units.ts and frontend/src/domain/pantry.ts.
 */
class UnitNormalizerAndShelfLifeTest {

    private Product product(double packSize, String packUnit, double packGrams) {
        Product product = new Product();
        product.setCode("farm-fresh-eggs");
        product.setPackSize(packSize);
        product.setPackUnit(packUnit);
        product.setPackGrams(packGrams);
        return product;
    }

    @Test
    @DisplayName("grams and kilograms normalise to grams")
    void massUnits() {
        assertThat(UnitNormalizer.normalise(500, "g", null).quantity()).isEqualTo(500);
        assertThat(UnitNormalizer.normalise(500, "g", null).unit()).isEqualTo("g");
        assertThat(UnitNormalizer.normalise(1.5, "kg", null).quantity()).isEqualTo(1500);
        assertThat(UnitNormalizer.normalise(1.5, "KG", null).quantity()).isEqualTo(1500);
    }

    @Test
    @DisplayName("millilitres and litres normalise to ml, never confused with grams")
    void liquidUnits() {
        assertThat(UnitNormalizer.normalise(200, "ml", null).unit()).isEqualTo("ml");
        assertThat(UnitNormalizer.normalise(1, "l", null).quantity()).isEqualTo(1000);
        assertThat(UnitNormalizer.normalise(1, "litre", null).unit()).isEqualTo("ml");
    }

    @Test
    @DisplayName("piece-based products keep their count and convert to grams through the pack")
    void pieceUnits() {
        Product eggs = product(6, "piece", 300);

        UnitNormalizer.Normalised threeEggs = UnitNormalizer.normalise(3, "piece", eggs);

        assertThat(threeEggs.quantity()).isEqualTo(3);
        assertThat(threeEggs.unit()).isEqualTo("piece");
        assertThat(UnitNormalizer.pieceWeight(eggs)).isEqualTo(50);          // 300 g / 6 eggs
        assertThat(UnitNormalizer.toGrams(threeEggs, eggs)).isEqualTo(150);   // 3 × 50 g
    }

    @Test
    @DisplayName("unknown units fall back to the product's own pack unit")
    void unknownUnitFallsBack() {
        Product milk = product(1000, "ml", 1000);

        UnitNormalizer.Normalised normalised = UnitNormalizer.normalise(2, "bottle", milk);

        assertThat(normalised.unit()).isEqualTo("ml");
        assertThat(normalised.quantity()).isEqualTo(2);
    }

    @Test
    @DisplayName("fresh produce gets an estimated shelf life from its catalogue code")
    void shelfLifeByProductCode() {
        Product spinach = new Product();
        spinach.setCode("baby-spinach");

        assertThat(ShelfLife.daysFor(spinach, "Baby Spinach")).isEqualTo(3);
    }

    @Test
    @DisplayName("items without a catalogue code are estimated from their typed name")
    void shelfLifeByName() {
        assertThat(ShelfLife.daysFor(null, "Baby Spinach")).isEqualTo(3);
        assertThat(ShelfLife.daysFor(null, "something unknown")).isEqualTo(ShelfLife.DEFAULT_SHELF_LIFE_DAYS);
    }

    @Test
    @DisplayName("expiry is estimated from the purchase date when the pack has no printed date")
    void estimatedExpiry() {
        Product spinach = new Product();
        spinach.setCode("baby-spinach");
        LocalDate purchased = LocalDate.of(2026, 9, 20);

        assertThat(ShelfLife.estimatedExpiry(purchased, spinach, "Baby Spinach"))
                .isEqualTo(LocalDate.of(2026, 9, 23));
    }

    @Test
    @DisplayName("activity factors and goal adjustments used for nutrition targets are stable")
    void enumFactors() {
        assertThat(ActivityLevel.SEDENTARY.factor()).isEqualTo(1.2);
        assertThat(ActivityLevel.VERY_ACTIVE.factor()).isEqualTo(1.725);
        assertThat(ActivityLevel.MODERATELY_ACTIVE.label()).isEqualTo("Moderately Active");
    }
}