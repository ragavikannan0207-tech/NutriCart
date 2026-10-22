package com.nutricart.domain.enums;

import java.util.Arrays;
import java.util.Locale;

/**
 * Translates between the label strings the React client uses ("Vegetarian",
 * "No Restriction", "Fruits", …) and the Java enums. The API therefore never
 * leaks raw enum constant names to the frontend.
 */
public final class EnumLabels {

    private EnumLabels() {
    }

    public static Category category(String label) {
        return parse(Category.values(), label, Category.FRUITS);
    }

    public static DietType dietType(String label) {
        return parse(DietType.values(), label, DietType.NO_RESTRICTION);
    }

    public static Gender gender(String label) {
        return parse(Gender.values(), label, Gender.PREFER_NOT_TO_SAY);
    }

    public static ActivityLevel activityLevel(String label) {
        return parse(ActivityLevel.values(), label, ActivityLevel.LIGHTLY_ACTIVE);
    }

    public static HealthGoal healthGoal(String label) {
        return parse(HealthGoal.values(), label, HealthGoal.GENERAL_HEALTHY_EATING);
    }

    public static BudgetPeriod budgetPeriod(String label) {
        return parse(BudgetPeriod.values(), label, BudgetPeriod.WEEKLY);
    }

    public static PaymentMethod paymentMethod(String label) {
        return parse(PaymentMethod.values(), label, PaymentMethod.COD);
    }

    public static DayOfWeek dayOfWeek(String label) {
        return parse(DayOfWeek.values(), label, DayOfWeek.MONDAY);
    }

    public static MealSlot mealSlot(String label) {
        return parse(MealSlot.values(), label, MealSlot.BREAKFAST);
    }

    public static NotificationType notificationType(String label) {
        return parse(NotificationType.values(), label, NotificationType.SYSTEM);
    }

    private static <E extends Enum<E>> E parse(E[] values, String label, E fallback) {
        if (label == null || label.isBlank()) {
            return fallback;
        }
        String normalised = label.trim().toLowerCase(Locale.ROOT).replace('_', ' ').replace('-', ' ');
        return Arrays.stream(values)
                .filter(value -> normalise(value.name()).equals(normalised)
                        || labelOf(value).toLowerCase(Locale.ROOT).equals(normalised))
                .findFirst()
                .orElse(fallback);
    }

    private static String normalise(String name) {
        return name.toLowerCase(Locale.ROOT).replace('_', ' ');
    }

    @SuppressWarnings("unchecked")
    private static <E extends Enum<E>> String labelOf(E value) {
        try {
            Object label = value.getClass().getMethod("label").invoke(value);
            return label == null ? value.name() : label.toString();
        } catch (ReflectiveOperationException ignored) {
            return value.name();
        }
    }
}
