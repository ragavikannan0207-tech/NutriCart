package com.nutricart.domain;

import com.nutricart.domain.enums.Category;
import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;

/**
 * A real (or user-declared) item sitting in the kitchen.
 * The pantry is intentionally separate from the cart, expired items are never
 * deleted automatically, and freshness for unpackaged produce is marked as
 * estimated through {@code expiryEstimated}.
 */
@Entity
@Table(name = "pantry_items", indexes = {
        @Index(name = "idx_pantry_user", columnList = "user_id"),
        @Index(name = "idx_pantry_expiry", columnList = "expiry_date")
})
public class PantryItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, foreignKey = @ForeignKey(name = "fk_pantry_user"))
    private UserAccount user;

    @Column(name = "person_profile_id", nullable = false)
    private Long personProfileId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "product_id", foreignKey = @ForeignKey(name = "fk_pantry_product"))
    private Product product;

    @Column(nullable = false, length = 120)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private Category category;

    @Column(nullable = false)
    private double quantity;

    @Column(nullable = false, length = 12)
    private String unit;

    @Column(name = "normalised_quantity", nullable = false)
    private double normalisedQuantity;

    @Column(name = "normalised_unit", nullable = false, length = 8)
    private String normalisedUnit;

    @Column(name = "purchase_date", nullable = false)
    private LocalDate purchaseDate;

    @Column(name = "expiry_date", nullable = false)
    private LocalDate expiryDate;

    @Column(name = "expiry_estimated", nullable = false)
    private boolean expiryEstimated;

    @Column(length = 300)
    private String notes = "";

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
    public Long getPersonProfileId() { return personProfileId; }
    public void setPersonProfileId(Long personProfileId) { this.personProfileId = personProfileId; }
    public Product getProduct() { return product; }
    public void setProduct(Product product) { this.product = product; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public Category getCategory() { return category; }
    public void setCategory(Category category) { this.category = category; }
    public double getQuantity() { return quantity; }
    public void setQuantity(double quantity) { this.quantity = quantity; }
    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }
    public double getNormalisedQuantity() { return normalisedQuantity; }
    public void setNormalisedQuantity(double normalisedQuantity) { this.normalisedQuantity = normalisedQuantity; }
    public String getNormalisedUnit() { return normalisedUnit; }
    public void setNormalisedUnit(String normalisedUnit) { this.normalisedUnit = normalisedUnit; }
    public LocalDate getPurchaseDate() { return purchaseDate; }
    public void setPurchaseDate(LocalDate purchaseDate) { this.purchaseDate = purchaseDate; }
    public LocalDate getExpiryDate() { return expiryDate; }
    public void setExpiryDate(LocalDate expiryDate) { this.expiryDate = expiryDate; }
    public boolean isExpiryEstimated() { return expiryEstimated; }
    public void setExpiryEstimated(boolean expiryEstimated) { this.expiryEstimated = expiryEstimated; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes == null ? "" : notes; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
