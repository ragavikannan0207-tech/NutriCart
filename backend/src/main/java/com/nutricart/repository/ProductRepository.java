package com.nutricart.repository;

import com.nutricart.domain.Product;
import com.nutricart.domain.enums.Category;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProductRepository extends JpaRepository<Product, Long> {

    Optional<Product> findByCode(String code);

    List<Product> findAllByOrderByIdAsc();

    Page<Product> findByCategory(Category category, Pageable pageable);

    long countByCategory(Category category);

    /**
     * Case-insensitive, partial search across name, category, tags and keywords —
     * the same fields the frontend searches.
     */
    @Query("""
            select distinct p from Product p
            left join p.tags t
            left join p.keywords k
            where lower(p.name) like lower(concat('%', :term, '%'))
               or lower(cast(p.category as string)) like lower(concat('%', :term, '%'))
               or lower(t) like lower(concat('%', :term, '%'))
               or lower(k) like lower(concat('%', :term, '%'))
            """)
    List<Product> search(@Param("term") String term);

    @Query("select p from Product p where p.stockCount > 0 and p.protein >= :minProtein order by p.protein desc")
    List<Product> findHighProtein(@Param("minProtein") double minProtein, Pageable pageable);
}
