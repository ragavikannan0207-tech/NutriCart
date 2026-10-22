package com.nutricart.repository;

import com.nutricart.domain.Recipe;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RecipeRepository extends JpaRepository<Recipe, Long> {

    Optional<Recipe> findByCode(String code);

    List<Recipe> findAllByOrderByIdAsc();

    @Query("""
            select distinct r from Recipe r
            left join r.tags t
            where lower(r.name) like lower(concat('%', :term, '%'))
               or lower(r.description) like lower(concat('%', :term, '%'))
               or lower(t) like lower(concat('%', :term, '%'))
            """)
    List<Recipe> search(@Param("term") String term);
}
