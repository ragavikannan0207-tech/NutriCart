package com.nutricart.web;

import com.nutricart.dto.ShoppingDtos;
import com.nutricart.security.CurrentUser;
import com.nutricart.service.OrderService;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Orders: placement, history, tracking and the 60 second cancellation window.
 *
 * <p>Placing an order empties the cart and updates Orders, tracking, Budget,
 * Purchased Nutrition, Overview and For You in the same transaction. The invoice is
 * rendered by the React client from this exact payload, so what the customer
 * downloads is what was stored.
 */
@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @GetMapping
    public List<ShoppingDtos.OrderDto> list() {
        return orderService.list(CurrentUser.id());
    }

    @GetMapping("/{id}")
    public ShoppingDtos.OrderDto get(@PathVariable Long id) {
        return orderService.get(CurrentUser.id(), id);
    }

    @PostMapping
    public ResponseEntity<ShoppingDtos.OrderDto> place(@RequestBody ShoppingDtos.PlaceOrderRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(orderService.place(CurrentUser.id(), request));
    }

    /** Only possible inside the cancellation window measured from the stored timestamp. */
    @PostMapping("/{id}/cancel")
    public ShoppingDtos.OrderDto cancel(@PathVariable Long id) {
        return orderService.cancel(CurrentUser.id(), id);
    }

    /**
     * Persists any status advance that is due right now and returns the refreshed
     * order list, so tracking stays correct even before the scheduled job runs.
     */
    @PostMapping("/sync")
    public List<ShoppingDtos.OrderDto> sync() {
        return orderService.syncStatuses(CurrentUser.id());
    }
}