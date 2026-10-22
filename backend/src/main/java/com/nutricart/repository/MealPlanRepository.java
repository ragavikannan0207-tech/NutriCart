package com.nutricart.repository;

import com.nutricart.domain.MealPlan;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MealPlanRepository extends JpaRepository<MealPlan, Long> {

    Optional<MealPlan> findByUserIdAndPersonProfileIdAndWeekStart(Long userId, Long personProfileId, LocalDate weekStart);

    List<MealPlan> findByUserIdOrderByWeekStartDesc(Long userId);

    void deleteByPersonProfileId(Long personProfileId);
}
