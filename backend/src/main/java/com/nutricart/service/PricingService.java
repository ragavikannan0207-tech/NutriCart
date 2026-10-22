package com.nutricart.service;

import com.nutricart.domain.CartItem;
import com.nutricart.domain.OrderItem;
import com.nutricart.domain.Product;
import java.util.List;
import org.springframework.stereotype.Service;

/**
 * The single pricing engine on the server.
 * It mirrors frontend/src/domain/pricing.ts exactly, so the totals the customer
 * sees in the React cart are the totals persisted in MySQL.
 */
@Service
public class PricingService {

    public static final double FREE_DELIVERY_THRESHOLD = 499;
    public static final double DELIVERY_FEE = 39;
    public static final double TAX_RATE = 0.05;
    public static final double DISCOUNT_TIER_1_SUBTOTAL = 1500;
    public static final int DISCOUNT_TIER_1_PERCENT = 5;
    public static final double DISCOUNT_TIER_2_SUBTOTAL = 2500;
    public static final int DISCOUNT_TIER_2_PERCENT = 8;

    public static final String NUTRITION_DISCLAIMER =
            "Nutrition shown is that of the groceries purchased, calculated from the product values "
                    + "and the quantity bought. It is not a record of what was eaten.";

    public record Totals(double subtotal, double delivery, double tax, double discount, double grandTotal,
                         int discountPercent, int itemCount) {
    }

    public double lineTotal(double unitPrice, int quantity) {
        return round(unitPrice * quantity);
    }

    public int discountPercentFor(double subtotal) {
        if (subtotal >= DISCOUNT_TIER_2_SUBTOTAL) {
            return DISCOUNT_TIER_2_PERCENT;
        }
        if (subtotal >= DISCOUNT_TIER_1_SUBTOTAL) {
            return DISCOUNT_TIER_1_PERCENT;
        }
        return 0;
    }

    /** Prices a set of cart lines: subtotal -> quantity discount -> delivery -> GST. */
    public Totals price(List<CartItem> lines) {
        double subtotal = 0;
        int itemCount = 0;
        for (CartItem line : lines) {
            subtotal += lineTotal(line.getUnitPrice(), line.getQuantity());
            itemCount += line.getQuantity();
        }
        return priceSubtotal(round(subtotal), itemCount, null);
    }

    /** Re-prices an already stored subtotal (used when loading historic orders). */
    public Totals priceSubtotal(double subtotal, int itemCount) {
        return priceSubtotal(subtotal, itemCount, null);
    }

    private Totals priceSubtotal(double subtotal, int itemCount, Double deliveryOverride) {
        int discountPercent = discountPercentFor(subtotal);
        double discount = round(subtotal * discountPercent / 100.0);
        double taxable = subtotal - discount;
        double delivery = deliveryOverride != null
                ? deliveryOverride
                : (subtotal >= FREE_DELIVERY_THRESHOLD || itemCount == 0 ? 0 : DELIVERY_FEE);
        double tax = round(taxable * TAX_RATE);
        double grandTotal = round(taxable + delivery + tax);
        return new Totals(subtotal, round(delivery), tax, discount, grandTotal, discountPercent, itemCount);
    }

    /** Nutrition supplied by the groceries of an order (per unit x quantity). */
    public double[] nutritionTotals(List<OrderItem> items) {
        double calories = 0;
        double protein = 0;
        double carbs = 0;
        double fat = 0;
        double fiber = 0;
        for (OrderItem item : items) {
            calories += item.getCalories() * item.getQuantity();
            protein += item.getProtein() * item.getQuantity();
            carbs += item.getCarbs() * item.getQuantity();
            fat += item.getFat() * item.getQuantity();
            fiber += item.getFiber() * item.getQuantity();
        }
        return new double[] {
                Math.round(calories), round(protein), round(carbs), round(fat), round(fiber)
        };
    }

    /** Nutrition contained in one purchased unit (pack) of a catalogue product. */
    public double[] nutritionPerUnit(Product product) {
        double basis = product.getBasisAmount() <= 0 ? 100 : product.getBasisAmount();
        double scale = product.getPackGrams() / basis;
        return new double[] {
                round(product.getCalories() * scale),
                round(product.getProtein() * scale),
                round(product.getCarbs() * scale),
                round(product.getFat() * scale),
                round(product.getFiber() * scale)
        };
    }

    public double round(double value) {
        return Math.round(value * 100.0) / 100.0;
    }
}