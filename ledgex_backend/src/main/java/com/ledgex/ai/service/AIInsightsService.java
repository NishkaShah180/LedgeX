package com.ledgex.ai.service;

import com.ledgex.ai.dto.FinancialInsightsResponse;
import com.ledgex.analytics.dto.BudgetVsActualResponse;
import com.ledgex.analytics.dto.CategorySpendingResponse;
import com.ledgex.analytics.dto.FinancialHealthScoreResponse;
import com.ledgex.analytics.dto.MonthlyTrendResponse;
import com.ledgex.analytics.dto.OverviewAnalyticsResponse;
import com.ledgex.analytics.dto.SubscriptionSummaryAnalyticsResponse;
import com.ledgex.analytics.service.AnalyticsService;
import com.ledgex.auth.entity.User;
import com.ledgex.auth.repository.UserRepository;
import com.ledgex.common.exception.ResourceNotFoundException;
import com.ledgex.savings.entity.SavingsGoal;
import com.ledgex.savings.enums.SavingsGoalStatus;
import com.ledgex.savings.repository.SavingsGoalRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AIInsightsService {

    private static final BigDecimal HIGH_UTILIZATION_THRESHOLD = new BigDecimal("80");
    private static final BigDecimal LOW_UTILIZATION_THRESHOLD = new BigDecimal("70");
    private static final BigDecimal SUBSCRIPTION_INCOME_WARNING_THRESHOLD = new BigDecimal("30");

    private final AnalyticsService analyticsService;
    private final SavingsGoalRepository savingsGoalRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public FinancialInsightsResponse getFinancialInsights(String userEmail) {
        User user = getUserByEmail(userEmail);

        FinancialHealthScoreResponse healthScore = analyticsService.getFinancialHealthScore(userEmail);
        OverviewAnalyticsResponse overview = analyticsService.getOverview(userEmail);
        List<BudgetVsActualResponse> budgets = analyticsService.getBudgetVsActual(userEmail);
        List<CategorySpendingResponse> spendingByCategory = analyticsService.getSpendingByCategory(userEmail);
        SubscriptionSummaryAnalyticsResponse subscriptionSummary = analyticsService.getSubscriptionSummary(userEmail);
        List<MonthlyTrendResponse> monthlyTrend = analyticsService.getMonthlyTrend(userEmail);
        List<SavingsGoal> savingsGoals = savingsGoalRepository.findByUserIdOrderByTargetDateAsc(user.getId());

        List<String> warnings = new ArrayList<>();
        List<String> recommendations = new ArrayList<>();
        List<String> achievements = new ArrayList<>();

        applyBudgetInsights(budgets, warnings, achievements, recommendations);
        applySavingsGoalInsights(savingsGoals, warnings, achievements);
        applySubscriptionInsights(overview, subscriptionSummary, monthlyTrend, warnings);
        applySpendingRecommendations(spendingByCategory, recommendations);
        applySavingsRecommendations(overview, recommendations);

        if (overview.getNetBalance().compareTo(BigDecimal.ZERO) > 0) {
            achievements.add("Positive net balance this month");
        }

        String topInsight = resolveTopInsight(warnings, achievements, recommendations, healthScore);

        return FinancialInsightsResponse.builder()
                .financialHealthScore(healthScore.getScore())
                .topInsight(topInsight)
                .recommendations(recommendations)
                .warnings(warnings)
                .achievements(achievements)
                .build();
    }

    private void applyBudgetInsights(
            List<BudgetVsActualResponse> budgets,
            List<String> warnings,
            List<String> achievements,
            List<String> recommendations
    ) {
        if (budgets.isEmpty()) {
            return;
        }

        boolean allUnderLowUtilization = true;
        boolean allWithinBudget = true;

        for (BudgetVsActualResponse budget : budgets) {
            BigDecimal utilization = budget.getUtilizationPercentage();

            if (budget.getActualSpent().compareTo(budget.getBudgetLimit()) > 0) {
                warnings.add(budget.getCategory() + " budget exceeded");
                allWithinBudget = false;
            } else if (utilization.compareTo(HIGH_UTILIZATION_THRESHOLD) > 0) {
                warnings.add(budget.getCategory() + " budget is at "
                        + utilization.setScale(0, RoundingMode.HALF_UP) + "% utilization");
            }

            if (utilization.compareTo(LOW_UTILIZATION_THRESHOLD) >= 0) {
                allUnderLowUtilization = false;
            }
        }

        if (allWithinBudget) {
            achievements.add("Stayed within budget this month");
        }

        if (allUnderLowUtilization) {
            recommendations.add("All budgets are under 70% utilization — consider increasing savings contributions");
        }
    }

    private void applySavingsGoalInsights(
            List<SavingsGoal> savingsGoals,
            List<String> warnings,
            List<String> achievements
    ) {
        LocalDate today = LocalDate.now();
        LocalDate warningWindowEnd = today.plusDays(30);

        for (SavingsGoal goal : savingsGoals) {
            if (goal.getStatus() == SavingsGoalStatus.COMPLETED) {
                achievements.add("Savings goal completed: " + goal.getName());
            }

            if (goal.getStatus() == SavingsGoalStatus.IN_PROGRESS) {
                LocalDate targetDate = goal.getTargetDate();
                if (!targetDate.isBefore(today) && !targetDate.isAfter(warningWindowEnd)) {
                    long daysRemaining = ChronoUnit.DAYS.between(today, targetDate);
                    warnings.add("\"" + goal.getName() + "\" savings goal target is in "
                            + daysRemaining + " days with "
                            + goal.getSavedAmount().setScale(2, RoundingMode.HALF_UP)
                            + " saved of " + goal.getTargetAmount().setScale(2, RoundingMode.HALF_UP));
                }
            }
        }
    }

    private void applySubscriptionInsights(
            OverviewAnalyticsResponse overview,
            SubscriptionSummaryAnalyticsResponse subscriptionSummary,
            List<MonthlyTrendResponse> monthlyTrend,
            List<String> warnings
    ) {
        BigDecimal monthlyIncome = overview.getTotalIncome();
        BigDecimal monthlySubscriptionCost = subscriptionSummary.getMonthlyEstimatedCost();

        if (monthlyIncome.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal subscriptionShare = monthlySubscriptionCost
                    .multiply(BigDecimal.valueOf(100))
                    .divide(monthlyIncome, 2, RoundingMode.HALF_UP);

            if (subscriptionShare.compareTo(SUBSCRIPTION_INCOME_WARNING_THRESHOLD) > 0) {
                warnings.add("Subscription costs are consuming "
                        + subscriptionShare.setScale(0, RoundingMode.HALF_UP)
                        + "% of monthly income");
            }
        }

        if (monthlyTrend.size() >= 2 && subscriptionSummary.getActiveSubscriptions() > 0) {
            MonthlyTrendResponse previousMonth = monthlyTrend.get(monthlyTrend.size() - 2);
            MonthlyTrendResponse currentMonth = monthlyTrend.get(monthlyTrend.size() - 1);

            if (currentMonth.getExpense().compareTo(previousMonth.getExpense()) > 0) {
                warnings.add("Subscription costs are increasing");
            }
        }
    }

    private void applySpendingRecommendations(
            List<CategorySpendingResponse> spendingByCategory,
            List<String> recommendations
    ) {
        spendingByCategory.stream()
                .filter(spending -> isEntertainmentCategory(spending.getCategory()))
                .filter(spending -> spending.getAmount().compareTo(BigDecimal.ZERO) > 0)
                .findFirst()
                .ifPresent(spending -> recommendations.add(
                        "Reduce " + spending.getCategory().toLowerCase() + " spending by 15%"));
    }

    private void applySavingsRecommendations(
            OverviewAnalyticsResponse overview,
            List<String> recommendations
    ) {
        if (overview.getNetBalance().compareTo(BigDecimal.ZERO) > 0 && overview.getActiveSavingsGoals() > 0) {
            recommendations.add("Increase monthly savings contribution");
        }
    }

    private String resolveTopInsight(
            List<String> warnings,
            List<String> achievements,
            List<String> recommendations,
            FinancialHealthScoreResponse healthScore
    ) {
        if (!warnings.isEmpty()) {
            return warnings.getFirst();
        }
        if (!achievements.isEmpty()) {
            return achievements.getFirst();
        }
        if (!recommendations.isEmpty()) {
            return recommendations.getFirst();
        }
        return "Your financial health score is " + healthScore.getScore()
                + " (" + healthScore.getRating().name().toLowerCase() + ")";
    }

    private boolean isEntertainmentCategory(String category) {
        return category != null && category.equalsIgnoreCase("entertainment");
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }
}
