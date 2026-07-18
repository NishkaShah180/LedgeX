package com.ledgex.budget.repository;

import com.ledgex.budget.entity.Budget;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BudgetRepository extends JpaRepository<Budget, Long> {

    List<Budget> findByUserIdOrderByYearDescMonthDescCategoryAsc(Long userId);

    List<Budget> findByUserIdAndMonthAndYearOrderByCategoryAsc(Long userId, Integer month, Integer year);

    Optional<Budget> findByIdAndUserId(Long id, Long userId);

    boolean existsByUserIdAndCategoryAndMonthAndYear(Long userId, String category, Integer month, Integer year);

    boolean existsByUserIdAndCategoryAndMonthAndYearAndIdNot(
            Long userId, String category, Integer month, Integer year, Long id
    );

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("DELETE FROM Budget b WHERE b.user.id = :userId")
    void deleteByUserId(@org.springframework.data.repository.query.Param("userId") Long userId);
}
