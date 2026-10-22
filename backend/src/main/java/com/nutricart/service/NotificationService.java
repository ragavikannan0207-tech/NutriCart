package com.nutricart.service;

import com.nutricart.domain.Notification;
import com.nutricart.domain.PersonProfile;
import com.nutricart.domain.UserAccount;
import com.nutricart.domain.enums.NotificationType;
import com.nutricart.dto.ShoppingDtos;
import com.nutricart.exception.ApiException;
import com.nutricart.repository.NotificationRepository;
import com.nutricart.repository.PersonProfileRepository;
import com.nutricart.repository.UserAccountRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Event notifications for the signed-in account.
 *
 * <p>Order progress, budget warnings and cancellations are written by the server as
 * they happen (see {@link OrderService}); time-based ones — pantry expiry and the
 * weekly plan — are requested by the client when it refreshes, which is why they
 * arrive here through {@link #create}.
 */
@Service
public class NotificationService {

    private final NotificationRepository notifications;
    private final PersonProfileRepository profiles;
    private final UserAccountRepository users;
    private final DtoMapper mapper;

    public NotificationService(
            NotificationRepository notifications,
            PersonProfileRepository profiles,
            UserAccountRepository users,
            DtoMapper mapper) {
        this.notifications = notifications;
        this.profiles = profiles;
        this.users = users;
        this.mapper = mapper;
    }

    /** Newest first, exactly like the Notifications page expects. */
    @Transactional(readOnly = true)
    public List<ShoppingDtos.NotificationDto> list(Long userId) {
        return notifications.findByUserIdOrderByCreatedAtDesc(userId).stream().map(mapper::notification).toList();
    }

    @Transactional
    public ShoppingDtos.NotificationDto create(Long userId, ShoppingDtos.NotificationRequest request) {
        if (request.title() == null || request.title().isBlank()) {
            throw ApiException.field("title", "A notification needs a title.");
        }
        if (request.message() == null || request.message().isBlank()) {
            throw ApiException.field("message", "A notification needs a message.");
        }
        Notification notification = push(userId, new Draft(
                EnumParsing.notificationType("type", request.type()),
                request.title().trim(),
                request.message().trim(),
                request.actionPath(),
                request.personProfileId(),
                request.isImportant()));
        return mapper.notification(notification);
    }

    @Transactional
    public List<ShoppingDtos.NotificationDto> markRead(Long userId, Long id) {
        Notification notification = notifications.findByIdAndUserId(id, userId)
                .orElseThrow(() -> ApiException.notFound("We could not find that notification."));
        notification.setRead(true);
        notifications.save(notification);
        return list(userId);
    }

    @Transactional
    public List<ShoppingDtos.NotificationDto> markAllRead(Long userId) {
        List<Notification> all = notifications.findByUserIdAndIsReadFalse(userId);
        all.forEach(notification -> notification.setRead(true));
        notifications.saveAll(all);
        return list(userId);
    }

    @Transactional
    public List<ShoppingDtos.NotificationDto> remove(Long userId, Long id) {
        Notification notification = notifications.findByIdAndUserId(id, userId)
                .orElseThrow(() -> ApiException.notFound("We could not find that notification."));
        notifications.delete(notification);
        return list(userId);
    }

    /** Server-side description of an event that should appear in the bell menu. */
    public record Draft(
            NotificationType type,
            String title,
            String message,
            String actionPath,
            Long personProfileId,
            Boolean isImportant) {
    }

    /**
     * Writes a notification for an account. Used by the order lifecycle so a customer
     * is told about progress even while the browser tab is closed.
     */
    @Transactional
    public Notification push(Long userId, Draft draft) {
        UserAccount user = users.findById(userId)
                .orElseThrow(() -> ApiException.unauthorized("Your session has expired. Please sign in again."));
        Notification notification = new Notification();
        notification.setUser(user);
        notification.setPersonProfileId(validateProfile(userId, draft.personProfileId()));
        notification.setType(draft.type());
        notification.setTitle(draft.title());
        notification.setMessage(draft.message());
        notification.setActionPath(draft.actionPath() == null || draft.actionPath().isBlank()
                ? "/orders"
                : draft.actionPath());
        notification.setImportant(draft.isImportant() != null ? draft.isImportant() : draft.type().important());
        notification.setRead(false);
        return notifications.save(notification);
    }

    /**
     * A notification may mention a person profile, but only one that belongs to the
     * account — otherwise the profile-scoped filters on the Notifications page would
     * leak another account's data.
     */
    private Long validateProfile(Long userId, Long personProfileId) {
        if (personProfileId == null) {
            return null;
        }
        PersonProfile profile = profiles.findByIdAndUserId(personProfileId, userId).orElse(null);
        if (profile == null) {
            throw ApiException.field("personProfileId", "Select one of your own person profiles.");
        }
        return profile.getId();
    }
}