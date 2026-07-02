package com.ledgex.analytics.controller;

import com.ledgex.analytics.dto.BudgetVsActualResponse;
import com.ledgex.analytics.dto.CategorySpendingResponse;
import com.ledgex.analytics.dto.FinancialHealthScoreResponse;
import com.ledgex.analytics.dto.MonthlyTrendResponse;
import com.ledgex.analytics.dto.OverviewAnalyticsResponse;
import com.ledgex.analytics.dto.SavingsSummaryAnalyticsResponse;
import com.ledgex.analytics.dto.SubscriptionSummaryAnalyticsResponse;
import com.ledgex.analytics.dto.TopExpenseResponse;
import com.ledgex.analytics.service.AnalyticsService;
import com.ledgex.common.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/analytics")
@RequiredArgsConstructor
@Tag(name = "Analytics", description = "Financial analytics and health insights")
@SecurityRequirement(name = "Bearer Authentication")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/overview")
    @Operation(summary = "Get financial overview for the authenticated user")
    public ResponseEntity<ApiResponse<OverviewAnalyticsResponse>> getOverview(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer year
    ) {
        OverviewAnalyticsResponse response = analyticsService.getOverview(userDetails.getUsername(), month, year);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/spending-by-category")
    @Operation(summary = "Get spending breakdown by category for the selected month/year")
    public ResponseEntity<ApiResponse<List<CategorySpendingResponse>>> getSpendingByCategory(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer year
    ) {
        List<CategorySpendingResponse> responses = analyticsService.getSpendingByCategory(userDetails.getUsername(), month, year);
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @GetMapping("/monthly-trend")
    @Operation(summary = "Get income and expense trend for the last 6 months")
    public ResponseEntity<ApiResponse<List<MonthlyTrendResponse>>> getMonthlyTrend(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer year
    ) {
        List<MonthlyTrendResponse> responses = analyticsService.getMonthlyTrend(userDetails.getUsername(), month, year);
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @GetMapping("/top-expenses")
    @Operation(summary = "Get top expenses for the current month")
    public ResponseEntity<ApiResponse<List<TopExpenseResponse>>> getTopExpenses(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer year
    ) {
        List<TopExpenseResponse> responses = analyticsService.getTopExpenses(userDetails.getUsername(), month, year);
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @GetMapping("/budget-vs-actual")
    @Operation(summary = "Get budget vs actual spending for the current month")
    public ResponseEntity<ApiResponse<List<BudgetVsActualResponse>>> getBudgetVsActual(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer year
    ) {
        List<BudgetVsActualResponse> responses = analyticsService.getBudgetVsActual(userDetails.getUsername(), month, year);
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @GetMapping("/savings-summary")
    @Operation(summary = "Get savings goals analytics summary for the authenticated user")
    public ResponseEntity<ApiResponse<SavingsSummaryAnalyticsResponse>> getSavingsSummary(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer year
    ) {
        SavingsSummaryAnalyticsResponse response = analyticsService.getSavingsSummary(userDetails.getUsername(), month, year);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/subscription-summary")
    @Operation(summary = "Get subscription analytics summary for the authenticated user")
    public ResponseEntity<ApiResponse<SubscriptionSummaryAnalyticsResponse>> getSubscriptionSummary(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer year
    ) {
        SubscriptionSummaryAnalyticsResponse response = analyticsService.getSubscriptionSummary(userDetails.getUsername(), month, year);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/financial-health-score")
    @Operation(summary = "Get financial health score for the authenticated user")
    public ResponseEntity<ApiResponse<FinancialHealthScoreResponse>> getFinancialHealthScore(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer year
    ) {
        FinancialHealthScoreResponse response = analyticsService.getFinancialHealthScore(userDetails.getUsername(), month, year);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
