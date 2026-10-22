package com.nutricart.dto;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

/**
 * ---------------------------------------------------------------------------
 * NutriCart API payloads
 * ---------------------------------------------------------------------------
 * All records are grouped here so the wire format of the whole REST API can be
 * reviewed in one place. Field names match the TypeScript types in
 * frontend/src/types exactly, which is why enum values travel as their display
 * labels ("Vegetarian", "Fruits", "Out for Delivery") rather than constant names.
 */
public final class Dtos {

    private Dtos() {
    }

    /* ------------------------------------------------------------- AUTH ---- */

    public record RegisterRequest(String fullName, String email, String password, String confirmPassword) {
    }

    public record LoginRequest(String email, String password) {
    }

    public record UserDto(Long id, String fullName, String email, Instant createdAt) {
    }

    public record SessionResponse(String token, UserDto user) {
    }

    public record AccountRequest(String fullName) {
    }

    /* ---------------------------------------------------------- PROFILE ---- */

    public record ProfileRequest(
            String name,
            Integer age,
            String gender,
            Double heightCm,
            Double weightKg,
            String activityLevel,
            String dietType,
            String healthGoal,
            Double budgetAmount,
            String budgetPeriod,
            List<String> allergies,
            List<String> foodPreferences,
            Boolean isActive) {
    }

    public record ProfileDto(
            Long id,
            Long userId,
            String name,
            int age,
            String gender,
            double heightCm,
            double weightKg,
            String activityLevel,
            String dietType,
            String healthGoal,
            double budgetAmount,
            String budgetPeriod,
            List<String> allergies,
            List<String> foodPreferences,
            boolean isActive,
            Instant createdAt) {
    }

    public record AddressRequest(
            String label,
            String recipientName,
            String phone,
            String line1,
            String line2,
            String city,
            String state,
            String pincode,
            Boolean isDefault) {
    }

    public record AddressDto(
            Long id,
            Long userId,
            String label,
            String recipientName,
            String phone,
            String line1,
            String line2,
            String city,
            String state,
            String pincode,
            boolean isDefault) {
    }

    public record PreferencesDto(
            boolean notifyOrderUpdates,
            boolean notifyPantryExpiry,
            boolean notifyBudgetAlerts,
            boolean notifyRecommendations,
            boolean notifyWeeklyPlan,
            String nutritionPeriod,
            String defaultPantryUnit,
            String mealPreference,
            String measurementSystem,
            String currency,
            LocalDate lastPantryReview) {
    }

    /* ---------------------------------------------------------- CATALOG ---- */

    public record NutritionDto(double calories, double protein, double carbs, double fat, double fiber) {
    }

    public record ProductDto(
            Long id,
            String code,
            String name,
            String category,
            List<String> secondaryCategories,
            double price,
            double mrp,
            String unit,
            double packSize,
            String packUnit,
            String nutritionBasis,
            double basisAmount,
            double packGrams,
            String description,
            double rating,
            int reviewCount,
            String availability,
            int stockCount,
            double calories,
            double protein,
            double carbs,
            double fat,
            double fiber,
            String dietType,
            List<String> tags,
            List<String> keywords,
            List<String> healthyBenefits,
            List<String> relatedCodes,
            List<String> alternativeCodes,
            NutritionDto nutritionPerUnit,
            String image,
            boolean isNew,
            boolean isBestseller,
            Instant createdAt) {
    }

    public record RecipeIngredientDto(
            Long productId,
            double quantity,
            String unit,
            double normalisedQuantity,
            String normalisedUnit,
            boolean optional,
            String note) {
    }

    public record RecipeDto(
            Long id,
            String code,
            String name,
            String description,
            String image,
            int prepTimeMinutes,
            int cookTimeMinutes,
            int servings,
            String dietType,
            List<String> mealSlots,
            List<String> tags,
            List<RecipeIngredientDto> ingredients,
            List<String> steps,
            List<String> swapCodes,
            double calories,
            double protein,
            double carbs,
            double fat,
            double fiber) {
    }
}
