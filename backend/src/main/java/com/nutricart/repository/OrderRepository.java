package com.nutricart.repository;

import com.nutricart.domain.Order;
import com.nutricart.domain.enums.OrderStatus;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderRepository extends JpaRepository<Order, Long> {

    List<Order> findByUserIdOrderByCreatedAtDesc(Long userId);

    Optional<Order> findByIdAndUserId(Long id, Long userId);

    List<Order> findByStatusNotIn(List<OrderStatus> statuses);

    /** Orders placed for a person profile (used when that profile is deleted). */
    List<Order> findByPersonId(Long personProfileId);

    long countByUserId(Long userId);
}
