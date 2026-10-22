package com.nutricart.repository;

import com.nutricart.domain.Notification;
import com.nutricart.domain.enums.NotificationType;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByUserIdOrderByCreatedAtDesc(Long userId);

    Optional<Notification> findByIdAndUserId(Long id, Long userId);

    List<Notification> findByUserIdAndIsReadFalse(Long userId);

    boolean existsByUserIdAndTypeAndCreatedAtAfter(Long userId, NotificationType type, java.time.Instant after);
}
