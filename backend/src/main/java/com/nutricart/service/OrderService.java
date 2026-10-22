package com.nutricart.service;

import com.nutricart.config.OrderProperties;
import com.nutricart.domain.Address;
import com.nutricart.domain.CartItem;
import com.nutricart.domain.Order;
import com.nutricart.domain.OrderItem;
import com.nutricart.domain.PersonProfile;
import com.nutricart.domain.Product;
import com.nutricart.domain.UserAccount;
import com.nutricart.domain.enums.NotificationType;
import com.nutricart.domain.enums.OrderStatus;
import com.nutricart.domain.enums.PaymentMethod;
import com.nutricart.dto.ShoppingDtos;
import com.nutricart.exception.ApiException;
import com.nutricart.repository.OrderRepository;
import com.nutricart.repository.UserAccountRepository;
import com.nutricart.service.PricingService.Totals;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Order placement, tracking and the 60 second cancellation window.
 *
 * <p>Placing an order captures an immutable snapshot (prices, address, person and
 * nutrition), empties the cart, raises the "Order Confirmed" notification and — in
 * one transaction — updates everything the frontend refreshes afterwards: Orders,
 * tracking, Budget, Purchased Nutrition, Overview and For You.
 */
@Service
public class OrderService {

    private static final DateTimeFormatter ORDER_STAMP = DateTimeFormatter.ofPattern("yyyyMMdd");
    private static final List<OrderStatus> ACTIVE_STATUSES =
            List.of(OrderStatus.CONFIRMED, OrderStatus.PROCESSING, OrderStatus.PACKED, OrderStatus.OUT_FOR_DELIVERY);

    private final OrderRepository orders;
    private final CartService cartService;
    private final ProfileService profileService;
    private final AddressService addressService;
    private final PricingService pricing;
    private final NotificationService notificationService;
    private final BudgetService budgetService;
    private final UserAccountRepository users;
    private final OrderProperties orderProperties;
    private final DtoMapper mapper;

    public OrderService(
            OrderRepository orders,
            CartService cartService,
            ProfileService profileService,
            AddressService addressService,
            PricingService pricing,
            NotificationService notificationService,
            BudgetService budgetService,
            UserAccountRepository users,
            OrderProperties orderProperties,
            DtoMapper mapper) {
        this.orders = orders;
        this.cartService = cartService;
        this.profileService = profileService;
        this.addressService = addressService;
        this.pricing = pricing;
        this.notificationService = notificationService;
        this.budgetService = budgetService;
        this.users = users;
        this.orderProperties = orderProperties;
        this.mapper = mapper;
    }

    @Transactional(readOnly = true)
    public List<ShoppingDtos.OrderDto> list(Long userId) {
        return orders.findByUserIdOrderByCreatedAtDesc(userId).stream().map(mapper::order).toList();
    }

    @Transactional(readOnly = true)
    public ShoppingDtos.OrderDto get(Long userId, Long id) {
        return mapper.order(require(userId, id));
    }

    @Transactional(readOnly = true)
    public Order require(Long userId, Long id) {
        return orders.findByIdAndUserId(id, userId)
                .orElseThrow(() -> ApiException.notFound("We could not find that order."));
    }

    /**
     * Human readable order reference: {@code NC-<yyyyMMdd>-<sequence>}.
     *
     * <p>The sequence is the order's own generated id, which makes the reference unique
     * by construction and immune to concurrent checkouts. Ids are monotonic, so within a
     * day the numbers still read in the order they were placed.
     */
    public String orderNumberFor(Instant createdAt, long sequence) {
        String stamp = LocalDate.ofInstant(createdAt, ZoneOffset.UTC).format(ORDER_STAMP);
        return "NC-" + stamp + "-" + String.format("%04d", sequence);
    }

    private UserAccount requireUser(Long userId) {
        return users.findById(userId)
                .orElseThrow(() -> ApiException.unauthorized("Your session has expired. Please sign in again."));
    }

    /* ------------------------------------------------------------- PLACE --- */

    @Transactional
    public ShoppingDtos.OrderDto place(Long userId, ShoppingDtos.PlaceOrderRequest request) {
        UserAccount account = requireUser(userId);

        if (request.personProfileId() == null) {
            throw ApiException.field("personProfileId", "Select who you are shopping for before checking out.");
        }
        PersonProfile person = profileService.require(userId, request.personProfileId());

        if (request.addressId() == null) {
            throw ApiException.field("addressId", "Add a delivery address to place this order.");
        }
        Address address = addressService.require(userId, request.addressId());

        List<CartItem> lines = cartService.lines(userId).stream().filter(line -> line.getQuantity() > 0).toList();
        if (lines.isEmpty()) {
            throw ApiException.badRequest("Your cart is empty. Add a few groceries before checking out.");
        }

        PaymentMethod paymentMethod = EnumParsing.paymentMethod("paymentMethod", request.paymentMethod());
        String paymentReference = paymentReference(paymentMethod, request.paymentReference());
        Totals totals = pricing.price(lines);
        Instant createdAt = Instant.now();

        Order order = new Order();
        order.setUser(account);
        order.setPerson(person);
        order.setPersonName(person.getName());
        order.setCustomerName(account.getFullName());
        order.setAddressLabel(address.getLabel());
        order.setAddressRecipient(address.getRecipientName());
        order.setAddressPhone(address.getPhone());
        order.setAddressLine1(address.getLine1());
        order.setAddressLine2(address.getLine2());
        order.setAddressCity(address.getCity());
        order.setAddressState(address.getState());
        order.setAddressPincode(address.getPincode());
        order.setSubtotal(totals.subtotal());
        order.setDiscount(totals.discount());
        order.setDelivery(totals.delivery());
        order.setTax(totals.tax());
        order.setGrandTotal(totals.grandTotal());
        order.setPaymentMethod(paymentMethod);
        order.setPaymentReference(paymentReference);
        order.setStatus(OrderStatus.CONFIRMED);
        order.setCreatedAt(createdAt);
        order.setUpdatedAt(createdAt);
        order.setEstimatedDeliveryAt(
                createdAt.plus(Duration.ofMinutes(orderProperties.getDeliveryWindowMaxMinutes())));
        order.setNotes(request.notes() == null ? "" : request.notes());

        List<OrderItem> items = new ArrayList<>();
        for (CartItem line : lines) {
            items.add(buildItem(order, line));
        }
        order.setItems(items);

        double[] nutrition = pricing.nutritionTotals(items);
        order.setNutritionCalories(nutrition[0]);
        order.setNutritionProtein(nutrition[1]);
        order.setNutritionCarbs(nutrition[2]);
        order.setNutritionFat(nutrition[3]);
        order.setNutritionFiber(nutrition[4]);

        Order saved = orders.saveAndFlush(order);

        // The reference is derived from the id the database just assigned. Using a row
        // count here would let two simultaneous checkouts compute the same number and
        // one of them would fail on the unique index — an order must never be lost to a
        // numbering race.
        saved.setOrderNumber(orderNumberFor(saved.getCreatedAt(), saved.getId()));
        saved = orders.save(saved);

        cartService.clear(userId);

        notificationService.push(userId, new NotificationService.Draft(
                NotificationType.ORDER_CONFIRMED,
                "Order " + saved.getOrderNumber() + " confirmed",
                saved.getItems().size() + " item" + (saved.getItems().size() == 1 ? "" : "s") + " for "
                        + person.getName() + ", arriving in " + orderProperties.getDeliveryWindowMinMinutes()
                        + "-" + orderProperties.getDeliveryWindowMaxMinutes() + " minutes",
                "/orders/" + saved.getId(),
                person.getId(),
                true));

        // Real budget check: raises a Budget Warning notification only when the period
        // spend has genuinely passed the limit this person set.
        budgetService.warnIfOverBudget(userId, person);

        return mapper.order(saved);
    }

    /* ---------------------------------------------------------- CANCEL ----- */

    /**
     * Cancellation is only possible inside the configured window (60 seconds by
     * default) measured from the stored {@code createdAt} timestamp, so it stays
     * correct after a reload or in a brand new session.
     */
    @Transactional
    public ShoppingDtos.OrderDto cancel(Long userId, Long id) {
        Order order = require(userId, id);
        if (order.getStatus() == OrderStatus.CANCELLED) {
            return mapper.order(order);
        }
        if (order.getStatus() == OrderStatus.DELIVERED) {
            throw ApiException.badRequest("Delivered orders cannot be cancelled.");
        }
        long elapsedSeconds = Duration.between(order.getCreatedAt(), Instant.now()).getSeconds();
        if (elapsedSeconds > orderProperties.getCancellationWindowSeconds()) {
            throw ApiException.badRequest("Orders can only be cancelled within "
                    + orderProperties.getCancellationWindowSeconds() + " seconds of being placed.");
        }

        order.setStatus(OrderStatus.CANCELLED);
        order.setCancelledAt(Instant.now());
        order.setUpdatedAt(Instant.now());
        Order saved = orders.save(order);

        notificationService.push(userId, new NotificationService.Draft(
                NotificationType.CANCELLED,
                "Order " + saved.getOrderNumber() + " cancelled",
                "This order was cancelled inside the cancellation window. No amount will be charged.",
                "/orders/" + saved.getId(),
                saved.getPerson().getId(),
                true));
        return mapper.order(saved);
    }

    /* -------------------------------------------------------- TRACKING ---- */

    /** Advances the signed-in customer's in-flight orders and returns their list. */
    @Transactional
    public List<ShoppingDtos.OrderDto> syncStatuses(Long userId) {
        orders.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .filter(order -> ACTIVE_STATUSES.contains(order.getStatus()))
                .forEach(this::advance);
        return list(userId);
    }

    /** System-wide pass used by the scheduled lifecycle job. */
    @Transactional
    public void syncAllStatuses() {
        orders.findByStatusNotIn(List.of(OrderStatus.DELIVERED, OrderStatus.CANCELLED)).forEach(this::advance);
    }

    private void advance(Order order) {
        OrderStatus target = statusFor(order, Instant.now());
        if (target == order.getStatus()) {
            return;
        }
        order.setStatus(target);
        order.setUpdatedAt(Instant.now());
        if (target == OrderStatus.DELIVERED) {
            order.setDeliveredAt(Instant.now());
        }
        orders.save(order);

        if (target == OrderStatus.OUT_FOR_DELIVERY || target == OrderStatus.DELIVERED) {
            notificationService.push(order.getUser().getId(), new NotificationService.Draft(
                    target == OrderStatus.DELIVERED ? NotificationType.DELIVERED : NotificationType.OUT_FOR_DELIVERY,
                    target == OrderStatus.DELIVERED
                            ? "Order " + order.getOrderNumber() + " delivered"
                            : "Order " + order.getOrderNumber() + " is out for delivery",
                    target == OrderStatus.DELIVERED
                            ? "Your groceries have been delivered. Download the invoice from the order."
                            : "Your delivery partner is on the way. Keep the phone handy.",
                    "/orders/" + order.getId(),
                    order.personId(),
                    true));
        }
    }

    /** Status implied by the timings in OrderProperties (inside the 10-20 min promise). */
    private OrderStatus statusFor(Order order, Instant now) {
        long minutes = Duration.between(order.getCreatedAt(), now).toMinutes();
        if (minutes >= orderProperties.getDeliveredAfterMinutes()) {
            return OrderStatus.DELIVERED;
        }
        if (minutes >= orderProperties.getOutForDeliveryAfterMinutes()) {
            return OrderStatus.OUT_FOR_DELIVERY;
        }
        if (minutes >= orderProperties.getPackedAfterMinutes()) {
            return OrderStatus.PACKED;
        }
        if (minutes >= orderProperties.getProcessingAfterMinutes()) {
            return OrderStatus.PROCESSING;
        }
        return OrderStatus.CONFIRMED;
    }

    private OrderItem buildItem(Order order, CartItem line) {
        Product product = line.getProduct();
        OrderItem item = new OrderItem();
        item.setOrder(order);
        item.setProduct(product);
        item.setProductCode(product.getCode());
        item.setProductName(product.getName());
        item.setUnit(product.getUnit());
        item.setCategory(product.getCategory().label());
        item.setUnitPrice(line.getUnitPrice());
        item.setQuantity(line.getQuantity());
        item.setLineTotal(pricing.lineTotal(line.getUnitPrice(), line.getQuantity()));

        double[] perUnit = pricing.nutritionPerUnit(product);
        item.setCalories(perUnit[0]);
        item.setProtein(perUnit[1]);
        item.setCarbs(perUnit[2]);
        item.setFat(perUnit[3]);
        item.setFiber(perUnit[4]);
        return item;
    }

    /**
     * Only a masked reference is ever stored: "Card ending 1234", the UPI id, or a
     * cash-on-delivery label. Full card numbers and CVVs never reach the database.
     */
    private String paymentReference(PaymentMethod method, String supplied) {
        String value = supplied == null ? "" : supplied.trim();
        return switch (method) {
            case COD -> "Cash on delivery";
            case UPI -> {
                if (value.isEmpty()) {
                    throw ApiException.field("paymentReference", "Enter the UPI ID used for this payment.");
                }
                yield value.startsWith("UPI ") ? value : "UPI " + value;
            }
            case CARD -> {
                if (value.isEmpty()) {
                    throw ApiException.field("paymentReference", "Enter the last four digits of the card.");
                }
                String digits = value.replaceAll("\\D", "");
                String last4 = digits.length() >= 4 ? digits.substring(digits.length() - 4) : digits;
                yield "Card ending " + last4;
            }
        };
    }
}
