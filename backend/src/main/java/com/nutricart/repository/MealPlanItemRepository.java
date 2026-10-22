package com.nutricart.repository;

import com.nutricart.domain.MealPlanItem;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MealPlanItemRepository extends JpaRepository<MealPlanItem, Long> {

    Optional<MealPlanItem> findByIdAndMealPlanUserId(Long id, Long userId);
}
