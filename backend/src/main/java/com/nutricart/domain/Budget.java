package com.nutricart.domain;

import com.nutricart.domain.enums.BudgetPeriod;
import jakarta.persistence.*;
import java.time.Instant;

/**
 * The grocery budget for one person profile. The amount is a user setting; the
 * spending view is always derived from real, non-cancelled orders.
 */
@Entity
@Table(name = "budgets", uniqueConstraints = @UniqueConstraint(name = "uk_budget_person", columnNames = {"user_id", "person_profile_id"}), indexes = @Index(name = "idx_budgets_user", columnList = "user_id"))
public class Budget {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, foreignKey = @ForeignKey(name = "fk_budgets_user"))
    private UserAccount user;

    @Column(name = "person_profile_id", nullable = false)
    private Long personProfileId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 12)
    private BudgetPeriod period = BudgetPeriod.WEEKLY;

    @Column(nullable = false)
    private double amount;

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
    public Long getPersonProfileId() { return personProfileId; }
    public void setPersonProfileId(Long personProfileId) { this.personProfileId = personProfileId; }
    public BudgetPeriod getPeriod() { return period; }
    public void setPeriod(BudgetPeriod period) { this.period = period; }
    public double getAmount() { return amount; }
    public void setAmount(double amount) { this.amount = amount; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
