package com.nutricart.web;

import com.nutricart.dto.ShoppingDtos;
import com.nutricart.security.CurrentUser;
import com.nutricart.service.NotificationService;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Notifications from real events: order progress, cancellations, pantry expiry,
 * budget warnings and weekly plan reminders. Filters on the Notifications page are
 * driven by the {@code isImportant} flag stored here.
 */
@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public List<ShoppingDtos.NotificationDto> list() {
        return notificationService.list(CurrentUser.id());
    }

    /**
     * Used by the client for time-based, genuinely-event-driven alerts it detects on
     * load (pantry items about to expire, weekly plan ready) so the account keeps a
     * single, deduplicated history.
     */
    @PostMapping
    public ResponseEntity<ShoppingDtos.NotificationDto> create(
            @RequestBody ShoppingDtos.NotificationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(notificationService.create(CurrentUser.id(), request));
    }

    @PostMapping("/{id}/read")
    public List<ShoppingDtos.NotificationDto> markRead(@PathVariable Long id) {
        return notificationService.markRead(CurrentUser.id(), id);
    }

    @PostMapping("/read-all")
    public List<ShoppingDtos.NotificationDto> markAllRead() {
        return notificationService.markAllRead(CurrentUser.id());
    }

    @DeleteMapping("/{id}")
    public List<ShoppingDtos.NotificationDto> remove(@PathVariable Long id) {
        return notificationService.remove(CurrentUser.id(), id);
    }
}