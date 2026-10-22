package com.nutricart.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/** A week of planned meals for one person profile. */
@Entity
@Table(name = "meal_plans", uniqueConstraints = @UniqueConstraint(name = "uk_meal_plan_user_week_person", columnNames = {"user_id", "week_start", "person_profile_id"}), indexes = @Index(name = "idx_meal_plans_user", columnList = "user_id"))
public class MealPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, foreignKey = @ForeignKey(name = "fk_meal_plans_user"))
    private UserAccount user;

    @Column(name = "person_profile_id", nullable = false)
    private Long personProfileId;

    /** Monday of the planned week. */
    @Column(name = "week_start", nullable = false)
    private LocalDate weekStart;

    @OneToMany(mappedBy = "mealPlan", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @OrderBy("id ASC")
    private List<MealPlanItem> items = new ArrayList<>();

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public UserAccount getUser() { return user; }
    public void setUser(UserAccount user) { this.user = user; }
    public Long getPersonProfileId() { return personProfileId; }
    public void setPersonProfileId(Long personProfileId) { this.personProfileId = personProfileId; }
    public LocalDate getWeekStart() { return weekStart; }
    public void setWeekStart(LocalDate weekStart) { this.weekStart = weekStart; }
    public List<MealPlanItem> getItems() { return items; }
    public void setItems(List<MealPlanItem> items) { this.items = MutableCollections.mutableCopyOf(items); }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
