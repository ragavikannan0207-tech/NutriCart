package com.nutricart.repository;

import com.nutricart.domain.Budget;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BudgetRepository extends JpaRepository<Budget, Long> {

    Optional<Budget> findByUserIdAndPersonProfileId(Long userId, Long personProfileId);

    void deleteByPersonProfileId(Long personProfileId);
}
