package com.ledgex.analytics.service;

import com.ledgex.analytics.dto.BudgetVsActualResponse;
import com.ledgex.analytics.dto.CategorySpendingResponse;
import com.ledgex.analytics.dto.FinancialHealthScoreResponse;
import com.ledgex.analytics.dto.MonthlyTrendResponse;
import com.ledgex.analytics.dto.OverviewAnalyticsResponse;
import com.ledgex.analytics.dto.SavingsSummaryAnalyticsResponse;
import com.ledgex.analytics.dto.SubscriptionSummaryAnalyticsResponse;
import com.ledgex.analytics.dto.TopExpenseResponse;
import com.ledgex.analytics.enums.HealthRating;
import com.ledgex.auth.entity.User;
import com.ledgex.auth.repository.UserRepository;
import com.ledgex.budget.entity.Budget;
import com.ledgex.budget.repository.BudgetRepository;
import com.ledgex.common.exception.ResourceNotFoundException;
import com.ledgex.savings.entity.SavingsGoal;
import com.ledgex.savings.enums.SavingsGoalStatus;
import com.ledgex.savings.repository.SavingsGoalRepository;
import com.ledgex.subscription.entity.Subscription;
import com.ledgex.subscription.repository.SubscriptionRepository;
import com.ledgex.transaction.entity.Transaction;
import com.ledgex.transaction.enums.TransactionType;
import com.ledgex.transaction.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private static final int UPCOMING_RENEWAL_DAYS = 30;
    private static final int MONTHLY_TREND_MONTHS = 6;
    private static final int TOP_EXPENSES_LIMIT = 10;
    private static final BigDecimal SUBSCRIPTION_INCOME_THRESHOLD = new BigDecimal("0.20");

    private final UserRepository userRepository;
    private final SavingsGoalRepository savingsGoalRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final BudgetRepository budgetRepository;
    private final TransactionRepository transactionRepository;

    @Transactional(readOnly = true)
    public OverviewAnalyticsResponse getOverview(String userEmail) {
        User user = getUserByEmail(userEmail);
        LocalDate today = LocalDate.now();
        LocalDate monthStart = today.withDayOfMonth(1);
        LocalDate monthEnd = today.withDayOfMonth(today.lengthOfMonth());

        BigDecimal totalIncome = transactionRepository.sumAmountByUserAndTypeAndDateRange(
                user.getId(), TransactionType.INCOME, monthStart, monthEnd);
        BigDecimal totalExpense = transactionRepository.sumAmountByUserAndTypeAndDateRange(
                user.getId(), TransactionType.EXPENSE, monthStart, monthEnd);

        long activeSubscriptions = subscriptionRepository
                .findByUserIdAndIsActiveTrueOrderByNextBillingDateAsc(user.getId()).size();
        long activeSavingsGoals = savingsGoalRepository.findByUserIdOrderByTargetDateAsc(user.getId())
                .stream()
                .filter(goal -> goal.getStatus() == SavingsGoalStatus.IN_PROGRESS)
                .count();

        return OverviewAnalyticsResponse.builder()
                .month(today.getMonthValue())
                .year(today.getYear())
                .totalIncome(totalIncome)
                .totalExpense(totalExpense)
                .netBalance(totalIncome.subtract(totalExpense))
                .transactionCount(transactionRepository.countByUserIdAndTransactionDateBetween(
                        user.getId(), monthStart, monthEnd))
                .activeSubscriptions(activeSubscriptions)
                .activeSavingsGoals(activeSavingsGoals)
                .build();
    }

    @Transactional(readOnly = true)
    public List<CategorySpendingResponse> getSpendingByCategory(String userEmail) {
        User user = getUserByEmail(userEmail);
        LocalDate today = LocalDate.now();
        LocalDate monthStart = today.withDayOfMonth(1);
        LocalDate monthEnd = today.withDayOfMonth(today.lengthOfMonth());

        List<Object[]> grouped = transactionRepository.sumAmountGroupedByCategory(
                user.getId(), TransactionType.EXPENSE, monthStart, monthEnd);

        BigDecimal totalExpense = grouped.stream()
                .map(row -> (BigDecimal) row[1])
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return grouped.stream()
                .map(row -> {
                    String category = (String) row[0];
                    BigDecimal amount = (BigDecimal) row[1];
                    BigDecimal percentage = totalExpense.compareTo(BigDecimal.ZERO) == 0
                            ? BigDecimal.ZERO
                            : amount.multiply(BigDecimal.valueOf(100))
                                    .divide(totalExpense, 2, RoundingMode.HALF_UP);
                    return CategorySpendingResponse.builder()
                            .category(category)
                            .amount(amount)
                            .percentage(percentage)
                            .build();
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public List<MonthlyTrendResponse> getMonthlyTrend(String userEmail) {
        User user = getUserByEmail(userEmail);
        YearMonth current = YearMonth.now();
        List<MonthlyTrendResponse> trend = new ArrayList<>();

        for (int i = MONTHLY_TREND_MONTHS - 1; i >= 0; i--) {
            YearMonth yearMonth = current.minusMonths(i);
            LocalDate startDate = yearMonth.atDay(1);
            LocalDate endDate = yearMonth.atEndOfMonth();

            BigDecimal income = transactionRepository.sumAmountByUserAndTypeAndDateRange(
                    user.getId(), TransactionType.INCOME, startDate, endDate);
            BigDecimal expense = transactionRepository.sumAmountByUserAndTypeAndDateRange(
                    user.getId(), TransactionType.EXPENSE, startDate, endDate);

            trend.add(MonthlyTrendResponse.builder()
                    .month(yearMonth.getMonthValue())
                    .year(yearMonth.getYear())
                    .income(income)
                    .expense(expense)
                    .netBalance(income.subtract(expense))
                    .build());
        }

        return trend;
    }

    @Transactional(readOnly = true)
    public List<TopExpenseResponse> getTopExpenses(String userEmail) {
        User user = getUserByEmail(userEmail);
        LocalDate today = LocalDate.now();
        LocalDate monthStart = today.withDayOfMonth(1);
        LocalDate monthEnd = today.withDayOfMonth(today.lengthOfMonth());

        return transactionRepository.findByUserIdAndTypeAndTransactionDateBetweenOrderByAmountDesc(
                        user.getId(), TransactionType.EXPENSE, monthStart, monthEnd)
                .stream()
                .limit(TOP_EXPENSES_LIMIT)
                .map(this::mapToTopExpense)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<BudgetVsActualResponse> getBudgetVsActual(String userEmail) {
        User user = getUserByEmail(userEmail);
        LocalDate today = LocalDate.now();

        return budgetRepository.findByUserIdAndMonthAndYearOrderByCategoryAsc(
                        user.getId(), today.getMonthValue(), today.getYear())
                .stream()
                .map(budget -> {
                    LocalDate startDate = LocalDate.of(budget.getYear(), budget.getMonth(), 1);
                    LocalDate endDate = startDate.withDayOfMonth(startDate.lengthOfMonth());

                    BigDecimal actualSpent = transactionRepository.sumAmountByUserAndTypeAndCategoryAndDateRange(
                            user.getId(),
                            TransactionType.EXPENSE,
                            budget.getCategory(),
                            startDate,
                            endDate
                    );

                    BigDecimal budgetLimit = budget.getMonthlyLimit();
                    BigDecimal remainingAmount = budgetLimit.subtract(actualSpent);
                    BigDecimal utilizationPercentage = actualSpent
                            .multiply(BigDecimal.valueOf(100))
                            .divide(budgetLimit, 2, RoundingMode.HALF_UP);

                    return BudgetVsActualResponse.builder()
                            .category(budget.getCategory())
                            .month(budget.getMonth())
                            .year(budget.getYear())
                            .budgetLimit(budgetLimit)
                            .actualSpent(actualSpent)
                            .remainingAmount(remainingAmount)
                            .utilizationPercentage(utilizationPercentage)
                            .build();
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public SavingsSummaryAnalyticsResponse getSavingsSummary(String userEmail) {
        User user = getUserByEmail(userEmail);
        List<SavingsGoal> goals = savingsGoalRepository.findByUserIdOrderByTargetDateAsc(user.getId());

        long activeGoals = 0;
        long completedGoals = 0;
        long cancelledGoals = 0;
        BigDecimal totalTargetAmount = BigDecimal.ZERO;
        BigDecimal totalSavedAmount = BigDecimal.ZERO;

        for (SavingsGoal goal : goals) {
            switch (goal.getStatus()) {
                case IN_PROGRESS -> activeGoals++;
                case COMPLETED -> completedGoals++;
                case CANCELLED -> cancelledGoals++;
            }
            totalTargetAmount = totalTargetAmount.add(goal.getTargetAmount());
            totalSavedAmount = totalSavedAmount.add(goal.getSavedAmount());
        }

        return SavingsSummaryAnalyticsResponse.builder()
                .totalGoals(goals.size())
                .activeGoals(activeGoals)
                .completedGoals(completedGoals)
                .cancelledGoals(cancelledGoals)
                .totalTargetAmount(totalTargetAmount)
                .totalSavedAmount(totalSavedAmount)
                .overallSavingsProgressPercentage(calculateOverallSavingsProgress(totalSavedAmount, totalTargetAmount))
                .build();
    }

    @Transactional(readOnly = true)
    public SubscriptionSummaryAnalyticsResponse getSubscriptionSummary(String userEmail) {
        User user = getUserByEmail(userEmail);
        List<Subscription> subscriptions = subscriptionRepository.findByUserIdOrderByNextBillingDateAsc(user.getId());

        long activeCount = 0;
        long upcomingRenewalsCount = 0;
        BigDecimal monthlyEstimatedCost = BigDecimal.ZERO;
        LocalDate today = LocalDate.now();
        LocalDate renewalWindowEnd = today.plusDays(UPCOMING_RENEWAL_DAYS);

        for (Subscription subscription : subscriptions) {
            if (subscription.isActive()) {
                activeCount++;
                monthlyEstimatedCost = monthlyEstimatedCost.add(toMonthlyCost(subscription));

                LocalDate nextBillingDate = subscription.getNextBillingDate();
                if (!nextBillingDate.isBefore(today) && !nextBillingDate.isAfter(renewalWindowEnd)) {
                    upcomingRenewalsCount++;
                }
            }
        }

        monthlyEstimatedCost = monthlyEstimatedCost.setScale(2, RoundingMode.HALF_UP);
        BigDecimal yearlyEstimatedCost = monthlyEstimatedCost
                .multiply(BigDecimal.valueOf(12))
                .setScale(2, RoundingMode.HALF_UP);

        return SubscriptionSummaryAnalyticsResponse.builder()
                .totalSubscriptions(subscriptions.size())
                .activeSubscriptions(activeCount)
                .monthlyEstimatedCost(monthlyEstimatedCost)
                .yearlyEstimatedCost(yearlyEstimatedCost)
                .upcomingRenewalsCount(upcomingRenewalsCount)
                .build();
    }

    @Transactional(readOnly = true)
    public FinancialHealthScoreResponse getFinancialHealthScore(String userEmail) {
        User user = getUserByEmail(userEmail);
        LocalDate today = LocalDate.now();
        LocalDate monthStart = today.withDayOfMonth(1);
        LocalDate monthEnd = today.withDayOfMonth(today.lengthOfMonth());

        SavingsSummaryAnalyticsResponse savingsSummary = buildSavingsSummary(user.getId());
        BigDecimal monthlySubscriptionCost = calculateMonthlySubscriptionCost(user.getId());
        BigDecimal totalIncome = transactionRepository.sumAmountByUserAndTypeAndDateRange(
                user.getId(), TransactionType.INCOME, monthStart, monthEnd);
        BigDecimal totalExpense = transactionRepository.sumAmountByUserAndTypeAndDateRange(
                user.getId(), TransactionType.EXPENSE, monthStart, monthEnd);
        BigDecimal netBalance = totalIncome.subtract(totalExpense);

        BigDecimal budgetAdherencePoints = calculateBudgetAdherencePoints(user.getId(), today.getMonthValue(), today.getYear());
        BigDecimal savingsProgressPoints = calculateSavingsProgressPoints(savingsSummary.getOverallSavingsProgressPercentage());
        BigDecimal savingsRatePoints = calculateSavingsRatePoints(netBalance, totalIncome);
        BigDecimal subscriptionControlPoints = calculateSubscriptionControlPoints(monthlySubscriptionCost, totalIncome);

        int score = budgetAdherencePoints
                .add(savingsProgressPoints)
                .add(savingsRatePoints)
                .add(subscriptionControlPoints)
                .setScale(0, RoundingMode.HALF_UP)
                .intValue();
        score = Math.min(100, Math.max(0, score));

        HealthRating rating = resolveRating(score);
        String explanation = buildExplanation(
                budgetAdherencePoints,
                savingsProgressPoints,
                savingsRatePoints,
                subscriptionControlPoints,
                savingsSummary.getOverallSavingsProgressPercentage(),
                netBalance,
                totalIncome,
                monthlySubscriptionCost,
                rating
        );

        return FinancialHealthScoreResponse.builder()
                .score(score)
                .rating(rating)
                .explanation(explanation)
                .build();
    }

    private SavingsSummaryAnalyticsResponse buildSavingsSummary(Long userId) {
        List<SavingsGoal> goals = savingsGoalRepository.findByUserIdOrderByTargetDateAsc(userId);

        long activeGoals = 0;
        long completedGoals = 0;
        long cancelledGoals = 0;
        BigDecimal totalTargetAmount = BigDecimal.ZERO;
        BigDecimal totalSavedAmount = BigDecimal.ZERO;

        for (SavingsGoal goal : goals) {
            switch (goal.getStatus()) {
                case IN_PROGRESS -> activeGoals++;
                case COMPLETED -> completedGoals++;
                case CANCELLED -> cancelledGoals++;
            }
            totalTargetAmount = totalTargetAmount.add(goal.getTargetAmount());
            totalSavedAmount = totalSavedAmount.add(goal.getSavedAmount());
        }

        return SavingsSummaryAnalyticsResponse.builder()
                .totalGoals(goals.size())
                .activeGoals(activeGoals)
                .completedGoals(completedGoals)
                .cancelledGoals(cancelledGoals)
                .totalTargetAmount(totalTargetAmount)
                .totalSavedAmount(totalSavedAmount)
                .overallSavingsProgressPercentage(calculateOverallSavingsProgress(totalSavedAmount, totalTargetAmount))
                .build();
    }

    private BigDecimal calculateOverallSavingsProgress(BigDecimal totalSavedAmount, BigDecimal totalTargetAmount) {
        if (totalTargetAmount.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }

        BigDecimal progress = totalSavedAmount
                .multiply(BigDecimal.valueOf(100))
                .divide(totalTargetAmount, 2, RoundingMode.HALF_UP);

        if (progress.compareTo(BigDecimal.valueOf(100)) > 0) {
            return BigDecimal.valueOf(100).setScale(2, RoundingMode.HALF_UP);
        }

        return progress;
    }

    private BigDecimal calculateBudgetAdherencePoints(Long userId, int month, int year) {
        List<Budget> budgets = budgetRepository.findByUserIdAndMonthAndYearOrderByCategoryAsc(userId, month, year);
        if (budgets.isEmpty()) {
            return BigDecimal.valueOf(30);
        }

        BigDecimal totalAdherence = BigDecimal.ZERO;
        for (Budget budget : budgets) {
            LocalDate startDate = LocalDate.of(budget.getYear(), budget.getMonth(), 1);
            LocalDate endDate = startDate.withDayOfMonth(startDate.lengthOfMonth());

            BigDecimal amountSpent = transactionRepository.sumAmountByUserAndTypeAndCategoryAndDateRange(
                    userId,
                    TransactionType.EXPENSE,
                    budget.getCategory(),
                    startDate,
                    endDate
            );

            if (amountSpent.compareTo(budget.getMonthlyLimit()) <= 0) {
                totalAdherence = totalAdherence.add(BigDecimal.valueOf(100));
            }
        }

        BigDecimal averageAdherence = totalAdherence.divide(
                BigDecimal.valueOf(budgets.size()), 2, RoundingMode.HALF_UP);

        return averageAdherence.multiply(BigDecimal.valueOf(30))
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
    }

    private BigDecimal calculateSavingsProgressPoints(BigDecimal overallSavingsProgressPercentage) {
        return overallSavingsProgressPercentage
                .divide(BigDecimal.valueOf(4), 2, RoundingMode.HALF_UP)
                .min(BigDecimal.valueOf(25));
    }

    private BigDecimal calculateSavingsRatePoints(BigDecimal netBalance, BigDecimal totalIncome) {
        if (totalIncome.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }

        BigDecimal savingsRate = netBalance
                .multiply(BigDecimal.valueOf(100))
                .divide(totalIncome, 2, RoundingMode.HALF_UP);

        return savingsRate
                .divide(BigDecimal.valueOf(4), 2, RoundingMode.HALF_UP)
                .max(BigDecimal.ZERO)
                .min(BigDecimal.valueOf(25));
    }

    private BigDecimal calculateSubscriptionControlPoints(BigDecimal monthlySubscriptionCost, BigDecimal monthlyIncome) {
        if (monthlySubscriptionCost.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.valueOf(20);
        }

        if (monthlyIncome.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }

        BigDecimal threshold = monthlyIncome.multiply(SUBSCRIPTION_INCOME_THRESHOLD);
        if (monthlySubscriptionCost.compareTo(threshold) <= 0) {
            return BigDecimal.valueOf(20);
        }

        BigDecimal excess = monthlySubscriptionCost.subtract(threshold);
        BigDecimal allowableExcess = monthlyIncome.multiply(BigDecimal.ONE.subtract(SUBSCRIPTION_INCOME_THRESHOLD));
        BigDecimal deductionRatio = excess.divide(allowableExcess, 4, RoundingMode.HALF_UP);

        return BigDecimal.valueOf(20)
                .multiply(BigDecimal.ONE.subtract(deductionRatio.min(BigDecimal.ONE)))
                .setScale(2, RoundingMode.HALF_UP)
                .max(BigDecimal.ZERO);
    }

    private BigDecimal calculateMonthlySubscriptionCost(Long userId) {
        return subscriptionRepository.findByUserIdAndIsActiveTrueOrderByNextBillingDateAsc(userId)
                .stream()
                .map(this::toMonthlyCost)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal toMonthlyCost(Subscription subscription) {
        BigDecimal amount = subscription.getAmount();
        return switch (subscription.getBillingCycle()) {
            case DAILY -> amount.multiply(BigDecimal.valueOf(30));
            case WEEKLY -> amount.multiply(BigDecimal.valueOf(4));
            case MONTHLY -> amount;
            case YEARLY -> amount.divide(BigDecimal.valueOf(12), 2, RoundingMode.HALF_UP);
        };
    }

    private HealthRating resolveRating(int score) {
        if (score >= 80) {
            return HealthRating.EXCELLENT;
        }
        if (score >= 60) {
            return HealthRating.GOOD;
        }
        if (score >= 40) {
            return HealthRating.AVERAGE;
        }
        return HealthRating.POOR;
    }

    private String buildExplanation(
            BigDecimal budgetAdherencePoints,
            BigDecimal savingsProgressPoints,
            BigDecimal savingsRatePoints,
            BigDecimal subscriptionControlPoints,
            BigDecimal overallSavingsProgressPercentage,
            BigDecimal netBalance,
            BigDecimal totalIncome,
            BigDecimal monthlySubscriptionCost,
            HealthRating rating
    ) {
        BigDecimal savingsRate = totalIncome.compareTo(BigDecimal.ZERO) > 0
                ? netBalance.multiply(BigDecimal.valueOf(100)).divide(totalIncome, 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        return String.format(
                "Your financial health is rated %s. Budget adherence contributed %.0f/30 points, "
                        + "savings goal progress (%.2f%%) contributed %.0f/25 points, "
                        + "savings rate (%.2f%%) contributed %.0f/25 points, "
                        + "and subscription spending (%.2f/month vs %.2f income) contributed %.0f/20 points.",
                rating.name().toLowerCase(),
                budgetAdherencePoints,
                overallSavingsProgressPercentage,
                savingsProgressPoints,
                savingsRate,
                savingsRatePoints,
                monthlySubscriptionCost,
                totalIncome,
                subscriptionControlPoints
        );
    }

    private TopExpenseResponse mapToTopExpense(Transaction transaction) {
        return TopExpenseResponse.builder()
                .id(transaction.getId())
                .title(transaction.getTitle())
                .amount(transaction.getAmount())
                .category(transaction.getCategory())
                .transactionDate(transaction.getTransactionDate())
                .build();
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }
}
