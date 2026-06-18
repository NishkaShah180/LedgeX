package com.ledgex.ai.gemini.dto;

import com.ledgex.ai.dto.FinancialInsightsResponse;
import com.ledgex.analytics.dto.BudgetVsActualResponse;
import com.ledgex.analytics.dto.CategorySpendingResponse;
import com.ledgex.analytics.dto.FinancialHealthScoreResponse;
import com.ledgex.analytics.dto.OverviewAnalyticsResponse;
import com.ledgex.analytics.dto.SavingsSummaryAnalyticsResponse;
import com.ledgex.analytics.dto.SubscriptionSummaryAnalyticsResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GeminiRequestDTO {

    private FinancialHealthScoreResponse financialHealthScore;
    private OverviewAnalyticsResponse overview;
    private List<CategorySpendingResponse> spendingByCategory;
    private List<BudgetVsActualResponse> budgetVsActual;
    private SavingsSummaryAnalyticsResponse savingsSummary;
    private SubscriptionSummaryAnalyticsResponse subscriptionSummary;
    private FinancialInsightsResponse ruleBasedInsights;
}
