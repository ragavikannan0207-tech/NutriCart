package com.nutricart.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Order lifecycle timings, bound from {@code nutricart.order.*} in application.yml.
 *
 * <p>Every status change is a fixed number of minutes after the order was placed,
 * inside the 10–20 minute delivery promise shown at checkout. The same timeline is
 * implemented in frontend/src/domain/orders.ts so the browser can render progress
 * live while the server owns the persisted status.
 */
@Component
@ConfigurationProperties(prefix = "nutricart.order")
public class OrderProperties {

    /** Confirmed -> Processing. */
    private int processingAfterMinutes = 2;

    /** Confirmed -> Packed. */
    private int packedAfterMinutes = 5;

    /** Confirmed -> Out for Delivery. */
    private int outForDeliveryAfterMinutes = 8;

    /** Confirmed -> Delivered. */
    private int deliveredAfterMinutes = 15;

    /** How long after placement an order may still be cancelled. */
    private long cancellationWindowSeconds = 60;

    /** The 10–20 minute delivery promise advertised at checkout. */
    private int deliveryWindowMinMinutes = 10;
    private int deliveryWindowMaxMinutes = 20;

    public int getProcessingAfterMinutes() {
        return processingAfterMinutes;
    }

    public void setProcessingAfterMinutes(int processingAfterMinutes) {
        this.processingAfterMinutes = processingAfterMinutes;
    }

    public int getPackedAfterMinutes() {
        return packedAfterMinutes;
    }

    public void setPackedAfterMinutes(int packedAfterMinutes) {
        this.packedAfterMinutes = packedAfterMinutes;
    }

    public int getOutForDeliveryAfterMinutes() {
        return outForDeliveryAfterMinutes;
    }

    public void setOutForDeliveryAfterMinutes(int outForDeliveryAfterMinutes) {
        this.outForDeliveryAfterMinutes = outForDeliveryAfterMinutes;
    }

    public int getDeliveredAfterMinutes() {
        return deliveredAfterMinutes;
    }

    public void setDeliveredAfterMinutes(int deliveredAfterMinutes) {
        this.deliveredAfterMinutes = deliveredAfterMinutes;
    }

    public long getCancellationWindowSeconds() {
        return cancellationWindowSeconds;
    }

    public void setCancellationWindowSeconds(long cancellationWindowSeconds) {
        this.cancellationWindowSeconds = cancellationWindowSeconds;
    }

    public int getDeliveryWindowMinMinutes() {
        return deliveryWindowMinMinutes;
    }

    public void setDeliveryWindowMinMinutes(int deliveryWindowMinMinutes) {
        this.deliveryWindowMinMinutes = deliveryWindowMinMinutes;
    }

    public int getDeliveryWindowMaxMinutes() {
        return deliveryWindowMaxMinutes;
    }

    public void setDeliveryWindowMaxMinutes(int deliveryWindowMaxMinutes) {
        this.deliveryWindowMaxMinutes = deliveryWindowMaxMinutes;
    }
}