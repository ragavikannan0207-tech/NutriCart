package com.nutricart.repository;

import com.nutricart.domain.PersonProfile;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PersonProfileRepository extends JpaRepository<PersonProfile, Long> {

    List<PersonProfile> findByUserIdOrderByIdAsc(Long userId);

    Optional<PersonProfile> findByIdAndUserId(Long id, Long userId);

    Optional<PersonProfile> findFirstByUserIdAndActiveTrue(Long userId);

    long countByUserId(Long userId);
}
