package com.nutricart.service;

import com.nutricart.domain.Address;
import com.nutricart.domain.Budget;
import com.nutricart.domain.CartItem;
import com.nutricart.domain.MealPlan;
import com.nutricart.domain.MealPlanItem;
import com.nutricart.domain.Notification;
import com.nutricart.domain.Order;
import com.nutricart.domain.OrderItem;
import com.nutricart.domain.PantryItem;
import com.nutricart.domain.PersonProfile;
import com.nutricart.domain.Product;
import com.nutricart.domain.Recipe;
import com.nutricart.domain.RecipeIngredient;
import com.nutricart.domain.UserAccount;
import com.nutricart.domain.UserPreferences;
import com.nutricart.domain.WishlistItem;
import com.nutricart.domain.enums.Category;
import com.nutricart.domain.enums.EnumLabels;
import com.nutricart.domain.enums.NotificationType;
import com.nutricart.domain.enums.PaymentMethod;
import com.nutricart.dto.Dtos;
import com.nutricart.dto.ShoppingDtos;
import java.util.List;
import org.springframework.stereotype.Service;

/**
 * Maps JPA entities to the API DTOs.
 * Enum values are converted to their display labels here, so the JSON contract
 * matches the TypeScript types in frontend/src/types exactly.
 */
@Service
public class DtoMapper {

    private final PricingService pricing;

    public DtoMapper(PricingService pricing) {
        this.pricing = pricing;
    }

    public Dtos.UserDto user(UserAccount account) {
        return new Dtos.UserDto(account.getId(), account.getFullName(), account.getEmail(), account.getCreatedAt());
    }

    public Dtos.SessionResponse session(String token, UserAccount account) {
        return new Dtos.SessionResponse(token, user(account));
    }

    public Dtos.ProfileDto profile(PersonProfile profile) {
        return new Dtos.ProfileDto(
                profile.getId(),
                profile.getUser().getId(),
                profile.getName(),
                profile.getAge(),
                profile.getGender().label(),
                profile.getHeightCm(),
                profile.getWeightKg(),
                profile.getActivityLevel().label(),
                profile.getDietType().label(),
                profile.getHealthGoal().label(),
                profile.getBudgetAmount(),
                profile.getBudgetPeriod().label(),
                List.copyOf(profile.getAllergies()),
                List.copyOf(profile.getFoodPreferences()),
                profile.isActive(),
                profile.getCreatedAt());
    }

    public Dtos.AddressDto address(Address address) {
        return new Dtos.AddressDto(
                address.getId(),
                address.getUser().getId(),
                address.getLabel(),
                address.getRecipientName(),
                address.getPhone(),
                address.getLine1(),
                address.getLine2(),
                address.getCity(),
                address.getState(),
                address.getPincode(),
                address.isDefault());
    }

    public Dtos.PreferencesDto preferences(UserPreferences value) {
        return new Dtos.PreferencesDto(
                value.isNotifyOrderUpdates(),
                value.isNotifyPantryExpiry(),
                value.isNotifyBudgetAlerts(),
                value.isNotifyRecommendations(),
                value.isNotifyWeeklyPlan(),
                value.getNutritionPeriod(),
                value.getDefaultPantryUnit(),
                value.getMealPreference(),
                value.getMeasurementSystem(),
                value.getCurrency(),
                value.getLastPantryReview());
    }

    public NotificationType notificationType(String label) {
        return EnumLabels.notificationType(label);
    }

    public PaymentMethod paymentMethod(String label) {
        return EnumLabels.paymentMethod(label);
    }

    /* ------------------------------------------------------------ CATALOG -- */

    public Dtos.ProductDto product(Product product) {
        double[] perUnit = pricing.nutritionPerUnit(product);
        return new Dtos.ProductDto(
                product.getId(),
                product.getCode(),
                product.getName(),
                product.getCategory().label(),
                product.getSecondaryCategories().stream().map(Category::label).toList(),
                product.getPrice(),
                product.getMrp(),
                product.getUnit(),
                product.getPackSize(),
                product.getPackUnit(),
                product.getNutritionBasis(),
                product.getBasisAmount(),
                product.getPackGrams(),
                product.getDescription(),
                product.getRating(),
                product.getReviewCount(),
                product.getAvailability(),
                product.getStockCount(),
                product.getCalories(),
                product.getProtein(),
                product.getCarbs(),
                product.getFat(),
                product.getFiber(),
                product.getDietType().label(),
                List.copyOf(product.getTags()),
                List.copyOf(product.getKeywords()),
                List.copyOf(product.getHealthyBenefits()),
                List.copyOf(product.getRelatedCodes()),
                List.copyOf(product.getAlternativeCodes()),
                new Dtos.NutritionDto(perUnit[0], perUnit[1], perUnit[2], perUnit[3], perUnit[4]),
                "/products/" + product.getCode() + ".svg",
                product.isNew(),
                product.isBestseller(),
                product.getCreatedAt());
    }

    public Dtos.RecipeDto recipe(Recipe recipe) {
        return new Dtos.RecipeDto(
                recipe.getId(),
                recipe.getCode(),
                recipe.getName(),
                recipe.getDescription(),
                "/recipes/" + recipe.getCode() + ".svg",
                recipe.getPrepTimeMinutes(),
                recipe.getCookTimeMinutes(),
                recipe.getServings(),
                recipe.getDietType().label(),
                recipe.getMealSlots().stream().map(slot -> slot.label()).toList(),
                List.copyOf(recipe.getTags()),
                recipe.getIngredients().stream().map(this::ingredient).toList(),
                List.copyOf(recipe.getSteps()),
                List.copyOf(recipe.getSwapCodes()),
                recipe.getCalories(),
                recipe.getProtein(),
                recipe.getCarbs(),
                recipe.getFat(),
                recipe.getFiber());
    }

    private Dtos.RecipeIngredientDto ingredient(RecipeIngredient ingredient) {
        return new Dtos.RecipeIngredientDto(
                ingredient.getProduct().getId(),
                ingredient.getQuantity(),
                ingredient.getUnit(),
                ingredient.getNormalisedQuantity(),
                ingredient.getNormalisedUnit(),
                ingredient.isOptional(),
                ingredient.getNote());
    }

    /* ------------------------------------------------------- CART / WISH --- */

    public ShoppingDtos.CartLineDto cartLine(CartItem item) {
        return new ShoppingDtos.CartLineDto(
                item.getProduct().getId(), item.getQuantity(), item.getUnitPrice(), item.getAddedAt());
    }

    public ShoppingDtos.WishlistItemDto wishlistItem(WishlistItem item) {
        return new ShoppingDtos.WishlistItemDto(item.getProduct().getId(), item.getAddedAt());
    }

    /* --------------------------------------------------------------- ORDER -- */

    public ShoppingDtos.OrderDto order(Order order) {
        return new ShoppingDtos.OrderDto(
                order.getId(),
                order.getOrderNumber(),
                order.getUser().getId(),
                order.personId(),
                order.getPersonName(),
                order.getCustomerName(),
                new ShoppingDtos.OrderAddressDto(
                        order.getAddressLabel(),
                        order.getAddressRecipient(),
                        order.getAddressPhone(),
                        order.getAddressLine1(),
                        order.getAddressLine2(),
                        order.getAddressCity(),
                        order.getAddressState(),
                        order.getAddressPincode()),
                order.getItems().stream().map(this::orderItem).toList(),
                order.getSubtotal(),
                order.getDelivery(),
                order.getTax(),
                order.getDiscount(),
                order.getGrandTotal(),
                order.getPaymentMethod().label(),
                order.getPaymentReference(),
                order.getStatus().label(),
                order.getCreatedAt(),
                order.getEstimatedDeliveryAt(),
                order.getUpdatedAt(),
                order.getDeliveredAt(),
                order.getCancelledAt(),
                new Dtos.NutritionDto(
                        order.getNutritionCalories(),
                        order.getNutritionProtein(),
                        order.getNutritionCarbs(),
                        order.getNutritionFat(),
                        order.getNutritionFiber()),
                order.getNotes());
    }

    public ShoppingDtos.OrderItemDto orderItem(OrderItem item) {
        return new ShoppingDtos.OrderItemDto(
                item.getProduct().getId(),
                item.getProductCode(),
                item.getProductName(),
                "/products/" + item.getProductCode() + ".svg",
                item.getUnit(),
                item.getCategory(),
                item.getUnitPrice(),
                item.getQuantity(),
                item.getLineTotal(),
                item.getCalories(),
                item.getProtein(),
                item.getCarbs(),
                item.getFat(),
                item.getFiber());
    }

    /* -------------------------------------------------------------- PANTRY -- */

    public ShoppingDtos.PantryItemDto pantryItem(PantryItem item) {
        return new ShoppingDtos.PantryItemDto(
                item.getId(),
                item.getUser().getId(),
                item.getPersonProfileId(),
                item.getProduct() == null ? null : item.getProduct().getId(),
                item.getName(),
                item.getCategory().label(),
                item.getQuantity(),
                item.getUnit(),
                item.getNormalisedQuantity(),
                item.getNormalisedUnit(),
                item.getPurchaseDate(),
                item.getExpiryDate(),
                item.isExpiryEstimated(),
                item.getNotes(),
                item.getCreatedAt());
    }

    /* ------------------------------------------------------------ PLANNING -- */

    public ShoppingDtos.MealPlanDto mealPlan(MealPlan plan) {
        return new ShoppingDtos.MealPlanDto(
                plan.getId(),
                plan.getUser().getId(),
                plan.getPersonProfileId(),
                plan.getWeekStart().toString(),
                plan.getItems().stream().map(this::mealPlanItem).toList(),
                plan.getCreatedAt());
    }

    public ShoppingDtos.MealPlanItemDto mealPlanItem(MealPlanItem item) {
        return new ShoppingDtos.MealPlanItemDto(
                item.getId(),
                item.getMealPlan().getId(),
                item.getDay().label(),
                item.getSlot().label(),
                item.getRecipe().getId(),
                item.getServings());
    }

    public ShoppingDtos.BudgetDto budget(Budget budget) {
        return new ShoppingDtos.BudgetDto(
                budget.getId(),
                budget.getUser().getId(),
                budget.getPersonProfileId(),
                budget.getPeriod().label(),
                budget.getAmount(),
                budget.getUpdatedAt());
    }

    /* ------------------------------------------------------- NOTIFICATIONS -- */

    public ShoppingDtos.NotificationDto notification(Notification notification) {
        return new ShoppingDtos.NotificationDto(
                notification.getId(),
                notification.getUser().getId(),
                notification.getPersonProfileId(),
                notification.getType().label(),
                notification.getTitle(),
                notification.getMessage(),
                notification.getActionPath(),
                notification.isImportant(),
                notification.isRead(),
                notification.getCreatedAt());
    }
}