package com.nutricart.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.nutricart.domain.CartItem;
import com.nutricart.domain.OrderItem;
import com.nutricart.domain.Product;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * The pricing rules that every screen and every invoice depend on.
 * These assertions are the contract the React cart implements in
 * frontend/src/domain/pricing.ts.
 */
class PricingServiceTest {

    private final PricingService pricing = new PricingService();

    private CartItem line(double unitPrice, int quantity) {
        CartItem item = new CartItem();
        item.setUnitPrice(unitPrice);
        item.setQuantity(quantity);
        Product product = new Product();
        product.setPrice(unitPrice);
        item.setProduct(product);
        return item;
    }

    @Test
    @DisplayName("subtotal, delivery, GST and grand total for a basket below the free-delivery threshold")
    void pricesSmallBasket() {
        PricingService.Totals totals = pricing.price(List.of(line(100, 2)));

        assertThat(totals.subtotal()).isEqualTo(200);
        assertThat(totals.itemCount()).isEqualTo(2);
        assertThat(totals.discountPercent()).isZero();
        assertThat(totals.discount()).isZero();
        assertThat(totals.delivery()).isEqualTo(39);          // ₹200 < ₹499 free-delivery threshold
        assertThat(totals.tax()).isEqualTo(10);               // 5% of 200
        assertThat(totals.grandTotal()).isEqualTo(249);       // 200 + 39 + 10
    }

    @Test
    @DisplayName("free delivery applies from ₹499 upwards")
    void freeDeliveryFrom499() {
        PricingService.Totals totals = pricing.price(List.of(line(499, 1)));

        assertThat(totals.delivery()).isZero();
        assertThat(totals.tax()).isEqualTo(24.95);            // 5% of 499
        assertThat(totals.grandTotal()).isEqualTo(523.95);    // 499 + 0 delivery + 24.95 GST
    }

    @Test
    @DisplayName("5% off at ₹1,500 and 8% off at ₹2,500, discount applied before GST")
    void quantityDiscountTiers() {
        PricingService.Totals fivePercent = pricing.price(List.of(line(750, 2)));
        assertThat(fivePercent.subtotal()).isEqualTo(1500);
        assertThat(fivePercent.discountPercent()).isEqualTo(5);
        assertThat(fivePercent.discount()).isEqualTo(75);
        assertThat(fivePercent.tax()).isEqualTo(71.25);       // 5% of 1425
        assertThat(fivePercent.grandTotal()).isEqualTo(1496.25);

        PricingService.Totals eightPercent = pricing.price(List.of(line(1300, 2)));
        assertThat(eightPercent.subtotal()).isEqualTo(2600);
        assertThat(eightPercent.discountPercent()).isEqualTo(8);
        assertThat(eightPercent.discount()).isEqualTo(208);
        assertThat(eightPercent.delivery()).isZero();
        assertThat(eightPercent.grandTotal()).isEqualTo(2511.6);
    }

    @Test
    @DisplayName("an empty cart costs nothing at all")
    void emptyCartIsZero() {
        PricingService.Totals totals = pricing.price(List.of());

        assertThat(totals.subtotal()).isZero();
        assertThat(totals.delivery()).isZero();
        assertThat(totals.grandTotal()).isZero();
    }

    @Test
    @DisplayName("line totals are rounded to two decimals")
    void lineTotalsAreRounded() {
        assertThat(pricing.lineTotal(89.99, 3)).isEqualTo(269.97);
    }

    @Test
    @DisplayName("order nutrition is the sum of per-unit nutrition × quantity")
    void orderNutrition() {
        OrderItem first = orderItem(100, 10, 2);
        OrderItem second = orderItem(50, 8, 1);

        double[] totals = pricing.nutritionTotals(List.of(first, second));

        assertThat(totals[0]).isEqualTo(250);   // 100×2 + 50×1 calories
        assertThat(totals[1]).isEqualTo(28);    // 10×2 + 8×1 protein
        assertThat(totals[2]).isZero();
        assertThat(totals[3]).isZero();
        assertThat(totals[4]).isZero();
    }

    @Test
    @DisplayName("per-pack nutrition scales the per-100 g values by the pack weight")
    void nutritionPerUnitScalesToPackWeight() {
        Product product = new Product();
        product.setCalories(160);
        product.setProtein(2);
        product.setCarbs(8.5);
        product.setFat(14.7);
        product.setFiber(6.7);
        product.setBasisAmount(100);
        product.setPackGrams(300);

        double[] perUnit = pricing.nutritionPerUnit(product);

        assertThat(perUnit[0]).isEqualTo(480);   // 160 kcal per 100 g × 3
        assertThat(perUnit[1]).isEqualTo(6);     // 2 g protein × 3
        assertThat(perUnit[4]).isEqualTo(20.1);  // 6.7 g fibre × 3
    }

    private OrderItem orderItem(double calories, double protein, int quantity) {
        OrderItem item = new OrderItem();
        item.setCalories(calories);
        item.setProtein(protein);
        item.setQuantity(quantity);
        return item;
    }
}