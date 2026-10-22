package com.nutricart.repository;

import com.nutricart.domain.PantryItem;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PantryItemRepository extends JpaRepository<PantryItem, Long> {

    List<PantryItem> findByUserIdOrderByExpiryDateAsc(Long userId);

    List<PantryItem> findByUserIdAndPersonProfileIdOrderByExpiryDateAsc(Long userId, Long personProfileId);

    Optional<PantryItem> findByIdAndUserId(Long id, Long userId);

    List<PantryItem> findByUserIdAndExpiryDateBetween(Long userId, LocalDate from, LocalDate to);

    void deleteByPersonProfileId(Long personProfileId);
}
