package com.ledgex.budget.service;

import com.ledgex.auth.entity.User;
import com.ledgex.auth.repository.UserRepository;
import com.ledgex.budget.dto.BudgetRequest;
import com.ledgex.budget.dto.BudgetResponse;
import com.ledgex.budget.dto.BudgetUtilizationResponse;
import com.ledgex.budget.entity.Budget;
import com.ledgex.budget.repository.BudgetRepository;
import com.ledgex.common.exception.BadRequestException;
import com.ledgex.common.exception.ResourceNotFoundException;
import com.ledgex.transaction.enums.TransactionType;
import com.ledgex.transaction.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BudgetService {

    private final BudgetRepository budgetRepository;
    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;

    @Transactional
    public BudgetResponse create(String userEmail, BudgetRequest request) {
        User user = getUserByEmail(userEmail);
        validateUniqueBudget(user.getId(), request.getCategory(), request.getMonth(), request.getYear(), null);

        Budget budget = Budget.builder()
                .user(user)
                .category(request.getCategory())
                .monthlyLimit(request.getMonthlyLimit())
                .month(request.getMonth())
                .year(request.getYear())
                .build();

        return mapToResponse(budgetRepository.save(budget));
    }

    @Transactional(readOnly = true)
    public List<BudgetResponse> getAll(String userEmail) {
        User user = getUserByEmail(userEmail);
        return budgetRepository.findByUserIdOrderByYearDescMonthDescCategoryAsc(user.getId())
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public BudgetResponse getById(String userEmail, Long id) {
        User user = getUserByEmail(userEmail);
        Budget budget = findBudgetByIdAndUser(id, user.getId());
        return mapToResponse(budget);
    }

    @Transactional
    public BudgetResponse update(String userEmail, Long id, BudgetRequest request) {
        User user = getUserByEmail(userEmail);
        Budget budget = findBudgetByIdAndUser(id, user.getId());
        validateUniqueBudget(user.getId(), request.getCategory(), request.getMonth(), request.getYear(), id);

        budget.setCategory(request.getCategory());
        budget.setMonthlyLimit(request.getMonthlyLimit());
        budget.setMonth(request.getMonth());
        budget.setYear(request.getYear());

        return mapToResponse(budgetRepository.save(budget));
    }

    @Transactional
    public void delete(String userEmail, Long id) {
        User user = getUserByEmail(userEmail);
        Budget budget = findBudgetByIdAndUser(id, user.getId());
        budgetRepository.delete(budget);
    }

    @Transactional(readOnly = true)
    public List<BudgetUtilizationResponse> getUtilization(String userEmail, Integer month, Integer year) {
        User user = getUserByEmail(userEmail);

        List<Budget> budgets = month != null && year != null
                ? budgetRepository.findByUserIdAndMonthAndYearOrderByCategoryAsc(user.getId(), month, year)
                : budgetRepository.findByUserIdOrderByYearDescMonthDescCategoryAsc(user.getId());

        return budgets.stream()
                .map(budget -> calculateUtilization(user.getId(), budget))
                .toList();
    }

    private BudgetUtilizationResponse calculateUtilization(Long userId, Budget budget) {
        LocalDate startDate = LocalDate.of(budget.getYear(), budget.getMonth(), 1);
        LocalDate endDate = startDate.withDayOfMonth(startDate.lengthOfMonth());

        BigDecimal amountSpent = transactionRepository.sumAmountByUserAndTypeAndCategoryAndDateRange(
                userId,
                TransactionType.EXPENSE,
                budget.getCategory(),
                startDate,
                endDate
        );

        BigDecimal budgetLimit = budget.getMonthlyLimit();
        BigDecimal remainingAmount = budgetLimit.subtract(amountSpent);
        BigDecimal utilizationPercentage = amountSpent
                .multiply(BigDecimal.valueOf(100))
                .divide(budgetLimit, 2, RoundingMode.HALF_UP);

        return BudgetUtilizationResponse.builder()
                .category(budget.getCategory())
                .budgetLimit(budgetLimit)
                .amountSpent(amountSpent)
                .remainingAmount(remainingAmount)
                .utilizationPercentage(utilizationPercentage)
                .build();
    }

    private void validateUniqueBudget(Long userId, String category, Integer month, Integer year, Long excludeId) {
        boolean exists = excludeId == null
                ? budgetRepository.existsByUserIdAndCategoryAndMonthAndYear(userId, category, month, year)
                : budgetRepository.existsByUserIdAndCategoryAndMonthAndYearAndIdNot(userId, category, month, year, excludeId);

        if (exists) {
            throw new BadRequestException("A budget already exists for this category, month, and year");
        }
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private Budget findBudgetByIdAndUser(Long id, Long userId) {
        return budgetRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Budget not found"));
    }

    private BudgetResponse mapToResponse(Budget budget) {
        return BudgetResponse.builder()
                .id(budget.getId())
                .category(budget.getCategory())
                .monthlyLimit(budget.getMonthlyLimit())
                .month(budget.getMonth())
                .year(budget.getYear())
                .createdAt(budget.getCreatedAt())
                .updatedAt(budget.getUpdatedAt())
                .build();
    }
}
