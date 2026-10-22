package com.nutricart.service;

import com.nutricart.domain.UserAccount;
import com.nutricart.domain.UserPreferences;
import com.nutricart.dto.Dtos;
import com.nutricart.exception.ApiException;
import com.nutricart.repository.UserAccountRepository;
import com.nutricart.repository.UserPreferencesRepository;
import java.time.LocalDate;
import java.util.Set;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Per-account application preferences (Settings → Notifications / Preferences).
 * One row per account holding every switch the Settings page exposes.
 */
@Service
public class PreferenceService {

    private static final Set<String> NUTRITION_PERIODS = Set.of("Daily", "Weekly", "Monthly");
    private static final Set<String> PANTRY_UNITS = Set.of("g", "kg", "piece");
    private static final Set<String> MEAL_PREFERENCES = Set.of("High Protein", "Balanced", "Low Carb", "Light");
    private static final Set<String> MEASUREMENT_SYSTEMS = Set.of("Metric", "Imperial");

    private final UserPreferencesRepository preferences;
    private final UserAccountRepository users;
    private final DtoMapper mapper;

    public PreferenceService(
            UserPreferencesRepository preferences, UserAccountRepository users, DtoMapper mapper) {
        this.preferences = preferences;
        this.users = users;
        this.mapper = mapper;
    }

    @Transactional(readOnly = true)
    public Dtos.PreferencesDto get(Long userId) {
        return mapper.preferences(require(userId));
    }

    @Transactional
    public Dtos.PreferencesDto save(Long userId, Dtos.PreferencesDto request) {
        UserPreferences entity = require(userId);
        entity.setNotifyOrderUpdates(request.notifyOrderUpdates());
        entity.setNotifyPantryExpiry(request.notifyPantryExpiry());
        entity.setNotifyBudgetAlerts(request.notifyBudgetAlerts());
        entity.setNotifyRecommendations(request.notifyRecommendations());
        entity.setNotifyWeeklyPlan(request.notifyWeeklyPlan());
        entity.setNutritionPeriod(oneOf("nutritionPeriod", request.nutritionPeriod(), NUTRITION_PERIODS, "Weekly"));
        entity.setDefaultPantryUnit(oneOf("defaultPantryUnit", request.defaultPantryUnit(), PANTRY_UNITS, "g"));
        entity.setMealPreference(oneOf("mealPreference", request.mealPreference(), MEAL_PREFERENCES, "Balanced"));
        entity.setMeasurementSystem(
                oneOf("measurementSystem", request.measurementSystem(), MEASUREMENT_SYSTEMS, "Metric"));
        entity.setLastPantryReview(request.lastPantryReview());
        preferences.save(entity);
        return mapper.preferences(entity);
    }

    /** Marks the pantry as reviewed today (used by the pantry review reminder). */
    @Transactional
    public Dtos.PreferencesDto markPantryReviewed(Long userId) {
        UserPreferences entity = require(userId);
        entity.setLastPantryReview(LocalDate.now());
        preferences.save(entity);
        return mapper.preferences(entity);
    }

    /** Creates the default preference row for a brand new account. */
    @Transactional
    public UserPreferences defaultsFor(UserAccount account) {
        return preferences.findByUserId(account.getId()).orElseGet(() -> {
            UserPreferences entity = new UserPreferences();
            entity.setUser(account);
            return preferences.save(entity);
        });
    }

    private UserPreferences require(Long userId) {
        return preferences.findByUserId(userId).orElseGet(() -> {
            UserAccount account = users.findById(userId)
                    .orElseThrow(() -> ApiException.unauthorized("Your session has expired. Please sign in again."));
            return defaultsFor(account);
        });
    }

    private String oneOf(String field, String value, Set<String> allowed, String fallback) {
        if (value == null || value.isBlank()) {
            return fallback;
        }
        String trimmed = value.trim();
        if (!allowed.contains(trimmed)) {
            throw ApiException.field(field, "Choose one of: " + String.join(", ", allowed) + ".");
        }
        return trimmed;
    }
}