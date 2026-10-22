package com.nutricart.config;

import com.nutricart.service.OrderService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Advances orders through Confirmed → Processing → Packed → Out for Delivery →
 * Delivered on the timeline configured in {@link OrderProperties}.
 *
 * <p>Running on the server means tracking keeps moving and the customer keeps
 * receiving notifications even with the browser closed; the React client reads the
 * same timings from frontend/src/domain/orders.ts to render progress instantly.
 */
@Component
public class OrderLifecycleJob {

    private static final Logger log = LoggerFactory.getLogger(OrderLifecycleJob.class);

    private final OrderService orderService;

    public OrderLifecycleJob(OrderService orderService) {
        this.orderService = orderService;
    }

    /** Every 30 seconds, which is fine-grained enough for a 10–20 minute delivery. */
    @Scheduled(fixedDelayString = "${nutricart.order.sync-interval-ms:30000}")
    public void advanceOrders() {
        try {
            orderService.syncAllStatuses();
        } catch (Exception failure) {
            log.warn("Order lifecycle sync failed: {}", failure.getMessage());
        }
    }
}