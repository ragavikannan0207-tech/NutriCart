package com.nutricart.service;

import com.nutricart.domain.enums.ActivityLevel;
import com.nutricart.domain.enums.BudgetPeriod;
import com.nutricart.domain.enums.Category;
import com.nutricart.domain.enums.DayOfWeek;
import com.nutricart.domain.enums.DietType;
import com.nutricart.domain.enums.EnumLabels;
import com.nutricart.domain.enums.Gender;
import com.nutricart.domain.enums.HealthGoal;
import com.nutricart.domain.enums.MealSlot;
import com.nutricart.domain.enums.NotificationType;
import com.nutricart.domain.enums.PaymentMethod;
import com.nutricart.exception.ApiException;
import java.util.Arrays;
import java.util.Locale;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Strict enum parsing for request payloads.
 *
 * <p>{@link EnumLabels} converts the display labels the React client sends
 * ("Vegetarian", "Out for Delivery") into Java enums and falls back to a default
 * when nothing matches. That default is right for optional fields but wrong for a
 * value the customer chose — silently storing COD for an unrecognised payment
 * method would be a data bug. These helpers keep the same label vocabulary and
 * reject anything they cannot match with a field-level 400, which the React forms
 * render next to the offending input.
 */
public final class EnumParsing {

    private EnumParsing() {
    }

    public static Category category(String field, String label) {
        return require(field, label, EnumLabels.category(label), Category.values(), Category::label);
    }

    public static DietType dietType(String field, String label) {
        return require(field, label, EnumLabels.dietType(label), DietType.values(), DietType::label);
    }

    public static Gender gender(String field, String label) {
        return require(field, label, EnumLabels.gender(label), Gender.values(), Gender::label);
    }

    public static ActivityLevel activityLevel(String field, String label) {
        return require(field, label, EnumLabels.activityLevel(label), ActivityLevel.values(), ActivityLevel::label);
    }

    public static HealthGoal healthGoal(String field, String label) {
        return require(field, label, EnumLabels.healthGoal(label), HealthGoal.values(), HealthGoal::label);
    }

    public static BudgetPeriod budgetPeriod(String field, String label) {
        return require(field, label, EnumLabels.budgetPeriod(label), BudgetPeriod.values(), BudgetPeriod::label);
    }

    public static PaymentMethod paymentMethod(String field, String label) {
        return require(field, label, EnumLabels.paymentMethod(label), PaymentMethod.values(), PaymentMethod::label);
    }

    public static DayOfWeek dayOfWeek(String field, String label) {
        return require(field, label, EnumLabels.dayOfWeek(label), DayOfWeek.values(), DayOfWeek::label);
    }

    public static MealSlot mealSlot(String field, String label) {
        return require(field, label, EnumLabels.mealSlot(label), MealSlot.values(), MealSlot::label);
    }

    public static NotificationType notificationType(String field, String label) {
        return require(field, label, EnumLabels.notificationType(label), NotificationType.values(),
                NotificationType::label);
    }

    /** Returns the parsed value, or fails with a 400 naming the accepted values. */
    private static <E extends Enum<E>> E require(
            String field, String label, E fallback, E[] values, Function<E, String> labelOf) {
        if (label == null || label.isBlank()) {
            return fallback;
        }
        String normalised = normalise(label);
        for (E value : values) {
            if (normalise(labelOf.apply(value)).equals(normalised) || normalise(value.name()).equals(normalised)) {
                return value;
            }
        }
        String allowed = Arrays.stream(values).map(labelOf).collect(Collectors.joining(", "));
        throw ApiException.field(field, "Choose one of: " + allowed + ".");
    }

    private static String normalise(String value) {
        return value.trim().toLowerCase(Locale.ROOT).replace('_', ' ').replace('-', ' ');
    }
}