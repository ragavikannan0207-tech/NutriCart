package com.nutricart.domain;

import com.nutricart.domain.enums.ActivityLevel;
import com.nutricart.domain.enums.BudgetPeriod;
import com.nutricart.domain.enums.DietType;
import com.nutricart.domain.enums.Gender;
import com.nutricart.domain.enums.HealthGoal;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * A person the account shops for. The active profile drives Shop recommendations,
 * Smart Grocery, Pantry, Recipes, Meal Planner, For You, Purchased Nutrition,
 * Budget and Healthy Alternatives.
 */
@Entity
@Table(name = "person_profiles", indexes = {
        @Index(name = "idx_profiles_user", columnList = "user_id"),
        @Index(name = "idx_profiles_active", columnList = "user_id,is_active")
})
public class PersonProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, foreignKey = @ForeignKey(name = "fk_profiles_user"))
    private UserAccount user;

    @Column(nullable = false, length = 80)
    private String name;

    @Column(nullable = false)
    private int age;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 24)
    private Gender gender = Gender.PREFER_NOT_TO_SAY;

    @Column(name = "height_cm", nullable = false)
    private double heightCm;

    @Column(name = "weight_kg", nullable = false)
    private double weightKg;

    @Enumerated(EnumType.STRING)
    @Column(name = "activity_level", nullable = false, length = 32)
    private ActivityLevel activityLevel = ActivityLevel.LIGHTLY_ACTIVE;

    @Enumerated(EnumType.STRING)
    @Column(name = "diet_type", nullable = false, length = 24)
    private DietType dietType = DietType.NO_RESTRICTION;

    @Enumerated(EnumType.STRING)
    @Column(name = "health_goal", nullable = false, length = 32)
    private HealthGoal healthGoal = HealthGoal.GENERAL_HEALTHY_EATING;

    @Column(name = "budget_amount", nullable = false)
    private double budgetAmount = 2500;

    @Enumerated(EnumType.STRING)
    @Column(name = "budget_period", nullable = false, length = 16)
    private BudgetPeriod budgetPeriod = BudgetPeriod.WEEKLY;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "profile_allergies", joinColumns = @JoinColumn(name = "profile_id"))
    @Column(name = "allergy", length = 60)
    private List<String> allergies = new ArrayList<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "profile_preferences", joinColumns = @JoinColumn(name = "profile_id"))
    @Column(name = "preference", length = 60)
    private List<String> foodPreferences = new ArrayList<>();

    @Column(name = "is_active", nullable = false)
    private boolean active;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    @PreUpdate
    void touch() {
        this.updatedAt = Instant.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public UserAccount getUser() { return user; }
    public void setUser(UserAccount user) { this.user = user; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public int getAge() { return age; }
    public void setAge(int age) { this.age = age; }
    public Gender getGender() { return gender; }
    public void setGender(Gender gender) { this.gender = gender; }
    public double getHeightCm() { return heightCm; }
    public void setHeightCm(double heightCm) { this.heightCm = heightCm; }
    public double getWeightKg() { return weightKg; }
    public void setWeightKg(double weightKg) { this.weightKg = weightKg; }
    public ActivityLevel getActivityLevel() { return activityLevel; }
    public void setActivityLevel(ActivityLevel activityLevel) { this.activityLevel = activityLevel; }
    public DietType getDietType() { return dietType; }
    public void setDietType(DietType dietType) { this.dietType = dietType; }
    public HealthGoal getHealthGoal() { return healthGoal; }
    public void setHealthGoal(HealthGoal healthGoal) { this.healthGoal = healthGoal; }
    public double getBudgetAmount() { return budgetAmount; }
    public void setBudgetAmount(double budgetAmount) { this.budgetAmount = budgetAmount; }
    public BudgetPeriod getBudgetPeriod() { return budgetPeriod; }
    public void setBudgetPeriod(BudgetPeriod budgetPeriod) { this.budgetPeriod = budgetPeriod; }
    public List<String> getAllergies() { return allergies; }
    public void setAllergies(List<String> allergies) {
        this.allergies = MutableCollections.mutableCopyOf(allergies);
    }
    public List<String> getFoodPreferences() { return foodPreferences; }
    public void setFoodPreferences(List<String> foodPreferences) {
        this.foodPreferences = MutableCollections.mutableCopyOf(foodPreferences);
    }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
