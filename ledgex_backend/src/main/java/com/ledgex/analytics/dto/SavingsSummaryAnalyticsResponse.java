package com.ledgex.analytics.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SavingsSummaryAnalyticsResponse {

    private long totalGoals;
    private long activeGoals;
    private long completedGoals;
    private long cancelledGoals;
    private BigDecimal totalTargetAmount;
    private BigDecimal totalSavedAmount;
    private BigDecimal overallSavingsProgressPercentage;
}
