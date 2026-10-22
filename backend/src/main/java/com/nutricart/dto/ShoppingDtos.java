package com.nutricart.dto;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

/** Cart, wishlist, order, pantry, planning and notification payloads. */
public final class ShoppingDtos {

    private ShoppingDtos() {
    }

    /* ------------------------------------------------------- CART / WISH --- */

    public record CartLineDto(Long productId, int quantity, double unitPrice, Instant addedAt) {
    }

    public record QuantityRequest(Integer quantity) {
    }

    public record DeltaRequest(Integer delta) {
    }

    public record MergeRequest(List<CartLineDto> lines) {
    }

    public record WishlistItemDto(Long productId, Instant addedAt) {
    }

    /* -------------------------------------------------------------- ORDER -- */

    public record PlaceOrderRequest(
            Long personProfileId,
            Long addressId,
            String paymentMethod,
            String paymentReference,
            String notes) {
    }

    public record OrderAddressDto(
            String label,
            String recipientName,
            String phone,
            String line1,
            String line2,
            String city,
            String state,
            String pincode) {
    }

    public record OrderItemDto(
            Long productId,
            String code,
            String name,
            String image,
            String unit,
            String category,
            double unitPrice,
            int quantity,
            double lineTotal,
            double calories,
            double protein,
            double carbs,
            double fat,
            double fiber) {
    }

    public record OrderDto(
            Long id,
            String orderNumber,
            Long userId,
            Long personProfileId,
            String personName,
            String customerName,
            OrderAddressDto address,
            List<OrderItemDto> items,
            double subtotal,
            double delivery,
            double tax,
            double discount,
            double grandTotal,
            String paymentMethod,
            String paymentReference,
            String status,
            Instant createdAt,
            Instant estimatedDeliveryAt,
            Instant updatedAt,
            Instant deliveredAt,
            Instant cancelledAt,
            Dtos.NutritionDto nutrition,
            String notes) {
    }

    /* ------------------------------------------------------------- PANTRY -- */

    public record PantryItemRequest(
            Long personProfileId,
            Long productId,
            String name,
            String category,
            Double quantity,
            String unit,
            LocalDate purchaseDate,
            LocalDate expiryDate,
            Boolean expiryEstimated,
            String notes) {
    }

    public record PantryItemDto(
            Long id,
            Long userId,
            Long personProfileId,
            Long productId,
            String name,
            String category,
            double quantity,
            String unit,
            double normalisedQuantity,
            String normalisedUnit,
            LocalDate purchaseDate,
            LocalDate expiryDate,
            boolean expiryEstimated,
            String notes,
            Instant createdAt) {
    }

    public record PantryAdjustResponse(boolean removed, List<PantryItemDto> items) {
    }

    /* ------------------------------------------------------------ PLANNING -- */

    public record MealPlanItemRequest(String day, String slot, Long recipeId, Integer servings, String weekStart) {
    }

    public record MealPlanItemPatch(Integer servings, Long recipeId, String day, String slot) {
    }

    public record MealPlanItemDto(Long id, Long mealPlanId, String day, String slot, Long recipeId, int servings) {
    }

    public record MealPlanDto(
            Long id,
            Long userId,
            Long personProfileId,
            String weekStart,
            List<MealPlanItemDto> items,
            Instant createdAt) {
    }

    public record BudgetRequest(Long personProfileId, Double amount, String period) {
    }

    public record BudgetDto(Long id, Long userId, Long personProfileId, String period, double amount, Instant updatedAt) {
    }

    /* ------------------------------------------------------ NOTIFICATIONS -- */

    public record NotificationRequest(
            String type,
            String title,
            String message,
            String actionPath,
            Long personProfileId,
            Boolean isImportant) {
    }

    public record NotificationDto(
            Long id,
            Long userId,
            Long personProfileId,
            String type,
            String title,
            String message,
            String actionPath,
            boolean isImportant,
            boolean isRead,
            Instant createdAt) {
    }
}
