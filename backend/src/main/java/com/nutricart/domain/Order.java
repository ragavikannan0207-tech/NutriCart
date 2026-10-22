package com.nutricart.domain;

import com.nutricart.domain.enums.OrderStatus;
import com.nutricart.domain.enums.PaymentMethod;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * A placed order. Prices, address, person and nutrition are captured as an
 * immutable snapshot at purchase time, so later catalogue edits never change
 * historic orders or invoices.
 */
@Entity
@Table(name = "orders", indexes = {
        @Index(name = "idx_orders_user", columnList = "user_id"),
        @Index(name = "idx_orders_number", columnList = "order_number", unique = true),
        @Index(name = "idx_orders_status", columnList = "status")
})
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Human readable order reference, e.g. {@code NC-20261003-0007}.
     *
     * <p>Unique, not null in the database, and assigned from the order's own generated
     * id (see OrderService) so that two concurrent checkouts can never collide on the
     * same number. The column is therefore nullable at insert time and filled inside
     * the same transaction — a reader outside that transaction never sees a null.
     */
    @Column(name = "order_number", unique = true, length = 32)
    private String orderNumber;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, foreignKey = @ForeignKey(name = "fk_orders_user"))
    private UserAccount user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "person_profile_id", foreignKey = @ForeignKey(name = "fk_orders_profile"))
    private PersonProfile person;

    /**
     * Person id captured with the order.
     * Nullable on purpose: deleting a person profile detaches their orders instead of
     * destroying order history, invoices and purchased-nutrition records. The name,
     * address and every price stay in the snapshot below, so a historic order always
     * renders correctly.
     */
    public Long personId() {
        return person == null ? null : person.getId();
    }

    @Column(name = "person_name", nullable = false, length = 80)
    private String personName;

    @Column(name = "customer_name", nullable = false, length = 120)
    private String customerName;

    @Column(name = "address_label", nullable = false, length = 40) private String addressLabel;
    @Column(name = "address_recipient", nullable = false, length = 120) private String addressRecipient;
    @Column(name = "address_phone", nullable = false, length = 15) private String addressPhone;
    @Column(name = "address_line1", nullable = false, length = 180) private String addressLine1;
    @Column(name = "address_line2", length = 180) private String addressLine2 = "";
    @Column(name = "address_city", nullable = false, length = 80) private String addressCity;
    @Column(name = "address_state", nullable = false, length = 80) private String addressState;
    @Column(name = "address_pincode", nullable = false, length = 6) private String addressPincode;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @OrderBy("id ASC")
    private List<OrderItem> items = new ArrayList<>();

    @Column(nullable = false) private double subtotal;
    @Column(nullable = false) private double delivery;
    @Column(nullable = false) private double tax;
    @Column(nullable = false) private double discount;
    @Column(name = "grand_total", nullable = false) private double grandTotal;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", nullable = false, length = 12)
    private PaymentMethod paymentMethod = PaymentMethod.COD;

    /** Masked reference only — full card numbers/CVV are never stored. */
    @Column(name = "payment_reference", nullable = false, length = 60)
    private String paymentReference = "";

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private OrderStatus status = OrderStatus.CONFIRMED;

    @Column(name = "nutrition_calories", nullable = false) private double nutritionCalories;
    @Column(name = "nutrition_protein", nullable = false) private double nutritionProtein;
    @Column(name = "nutrition_carbs", nullable = false) private double nutritionCarbs;
    @Column(name = "nutrition_fat", nullable = false) private double nutritionFat;
    @Column(name = "nutrition_fiber", nullable = false) private double nutritionFiber;

    @Column(name = "created_at", nullable = false) private Instant createdAt = Instant.now();
    @Column(name = "updated_at", nullable = false) private Instant updatedAt = Instant.now();
    @Column(name = "estimated_delivery_at", nullable = false) private Instant estimatedDeliveryAt = Instant.now();
    @Column(name = "delivered_at") private Instant deliveredAt;
    @Column(name = "cancelled_at") private Instant cancelledAt;
    @Column(length = 300) private String notes = "";

    @PreUpdate
    void touch() {
        this.updatedAt = Instant.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getOrderNumber() { return orderNumber; }
    public void setOrderNumber(String orderNumber) { this.orderNumber = orderNumber; }
    public UserAccount getUser() { return user; }
    public void setUser(UserAccount user) { this.user = user; }
    public PersonProfile getPerson() { return person; }
    public void setPerson(PersonProfile person) { this.person = person; }
    public String getPersonName() { return personName; }
    public void setPersonName(String personName) { this.personName = personName; }
    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }
    public String getAddressLabel() { return addressLabel; }
    public void setAddressLabel(String addressLabel) { this.addressLabel = addressLabel; }
    public String getAddressRecipient() { return addressRecipient; }
    public void setAddressRecipient(String addressRecipient) { this.addressRecipient = addressRecipient; }
    public String getAddressPhone() { return addressPhone; }
    public void setAddressPhone(String addressPhone) { this.addressPhone = addressPhone; }
    public String getAddressLine1() { return addressLine1; }
    public void setAddressLine1(String addressLine1) { this.addressLine1 = addressLine1; }
    public String getAddressLine2() { return addressLine2; }
    public void setAddressLine2(String addressLine2) { this.addressLine2 = addressLine2 == null ? "" : addressLine2; }
    public String getAddressCity() { return addressCity; }
    public void setAddressCity(String addressCity) { this.addressCity = addressCity; }
    public String getAddressState() { return addressState; }
    public void setAddressState(String addressState) { this.addressState = addressState; }
    public String getAddressPincode() { return addressPincode; }
    public void setAddressPincode(String addressPincode) { this.addressPincode = addressPincode; }
    public List<OrderItem> getItems() { return items; }
    public void setItems(List<OrderItem> items) { this.items = MutableCollections.mutableCopyOf(items); }
    public double getSubtotal() { return subtotal; }
    public void setSubtotal(double subtotal) { this.subtotal = subtotal; }
    public double getDelivery() { return delivery; }
    public void setDelivery(double delivery) { this.delivery = delivery; }
    public double getTax() { return tax; }
    public void setTax(double tax) { this.tax = tax; }
    public double getDiscount() { return discount; }
    public void setDiscount(double discount) { this.discount = discount; }
    public double getGrandTotal() { return grandTotal; }
    public void setGrandTotal(double grandTotal) { this.grandTotal = grandTotal; }
    public PaymentMethod getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(PaymentMethod paymentMethod) { this.paymentMethod = paymentMethod; }
    public String getPaymentReference() { return paymentReference; }
    public void setPaymentReference(String paymentReference) { this.paymentReference = paymentReference; }
    public OrderStatus getStatus() { return status; }
    public void setStatus(OrderStatus status) { this.status = status; }
    public double getNutritionCalories() { return nutritionCalories; }
    public void setNutritionCalories(double nutritionCalories) { this.nutritionCalories = nutritionCalories; }
    public double getNutritionProtein() { return nutritionProtein; }
    public void setNutritionProtein(double nutritionProtein) { this.nutritionProtein = nutritionProtein; }
    public double getNutritionCarbs() { return nutritionCarbs; }
    public void setNutritionCarbs(double nutritionCarbs) { this.nutritionCarbs = nutritionCarbs; }
    public double getNutritionFat() { return nutritionFat; }
    public void setNutritionFat(double nutritionFat) { this.nutritionFat = nutritionFat; }
    public double getNutritionFiber() { return nutritionFiber; }
    public void setNutritionFiber(double nutritionFiber) { this.nutritionFiber = nutritionFiber; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
    public Instant getEstimatedDeliveryAt() { return estimatedDeliveryAt; }
    public void setEstimatedDeliveryAt(Instant estimatedDeliveryAt) { this.estimatedDeliveryAt = estimatedDeliveryAt; }
    public Instant getDeliveredAt() { return deliveredAt; }
    public void setDeliveredAt(Instant deliveredAt) { this.deliveredAt = deliveredAt; }
    public Instant getCancelledAt() { return cancelledAt; }
    public void setCancelledAt(Instant cancelledAt) { this.cancelledAt = cancelledAt; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes == null ? "" : notes; }
}
