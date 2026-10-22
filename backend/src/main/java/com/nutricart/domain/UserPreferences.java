package com.nutricart.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;

/** Per-account application preferences set on the Settings page. */
@Entity
@Table(name = "user_preferences")
public class UserPreferences {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true, foreignKey = @ForeignKey(name = "fk_preferences_user"))
    private UserAccount user;

    @Column(name = "notify_order_updates", nullable = false) private boolean notifyOrderUpdates = true;
    @Column(name = "notify_pantry_expiry", nullable = false) private boolean notifyPantryExpiry = true;
    @Column(name = "notify_budget_alerts", nullable = false) private boolean notifyBudgetAlerts = true;
    @Column(name = "notify_recommendations", nullable = false) private boolean notifyRecommendations = true;
    @Column(name = "notify_weekly_plan", nullable = false) private boolean notifyWeeklyPlan = true;

    @Column(name = "nutrition_period", nullable = false, length = 12) private String nutritionPeriod = "Weekly";
    @Column(name = "default_pantry_unit", nullable = false, length = 8) private String defaultPantryUnit = "g";
    @Column(name = "meal_preference", nullable = false, length = 24) private String mealPreference = "Balanced";
    @Column(name = "measurement_system", nullable = false, length = 12) private String measurementSystem = "Metric";
    @Column(nullable = false, length = 6) private String currency = "INR";
    @Column(name = "last_pantry_review") private LocalDate lastPantryReview;

    @Column(name = "updated_at", nullable = false) private Instant updatedAt = Instant.now();

    @PreUpdate
    void touch() {
        this.updatedAt = Instant.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public UserAccount getUser() { return user; }
    public void setUser(UserAccount user) { this.user = user; }
    public boolean isNotifyOrderUpdates() { return notifyOrderUpdates; }
    public void setNotifyOrderUpdates(boolean notifyOrderUpdates) { this.notifyOrderUpdates = notifyOrderUpdates; }
    public boolean isNotifyPantryExpiry() { return notifyPantryExpiry; }
    public void setNotifyPantryExpiry(boolean notifyPantryExpiry) { this.notifyPantryExpiry = notifyPantryExpiry; }
    public boolean isNotifyBudgetAlerts() { return notifyBudgetAlerts; }
    public void setNotifyBudgetAlerts(boolean notifyBudgetAlerts) { this.notifyBudgetAlerts = notifyBudgetAlerts; }
    public boolean isNotifyRecommendations() { return notifyRecommendations; }
    public void setNotifyRecommendations(boolean notifyRecommendations) { this.notifyRecommendations = notifyRecommendations; }
    public boolean isNotifyWeeklyPlan() { return notifyWeeklyPlan; }
    public void setNotifyWeeklyPlan(boolean notifyWeeklyPlan) { this.notifyWeeklyPlan = notifyWeeklyPlan; }
    public String getNutritionPeriod() { return nutritionPeriod; }
    public void setNutritionPeriod(String nutritionPeriod) { this.nutritionPeriod = nutritionPeriod; }
    public String getDefaultPantryUnit() { return defaultPantryUnit; }
    public void setDefaultPantryUnit(String defaultPantryUnit) { this.defaultPantryUnit = defaultPantryUnit; }
    public String getMealPreference() { return mealPreference; }
    public void setMealPreference(String mealPreference) { this.mealPreference = mealPreference; }
    public String getMeasurementSystem() { return measurementSystem; }
    public void setMeasurementSystem(String measurementSystem) { this.measurementSystem = measurementSystem; }
    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }
    public LocalDate getLastPantryReview() { return lastPantryReview; }
    public void setLastPantryReview(LocalDate lastPantryReview) { this.lastPantryReview = lastPantryReview; }
    public Instant getUpdatedAt() { return updatedAt; }
}
