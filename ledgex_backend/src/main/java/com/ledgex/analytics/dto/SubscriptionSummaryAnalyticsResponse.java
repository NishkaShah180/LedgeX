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
public class SubscriptionSummaryAnalyticsResponse {

    private long totalSubscriptions;
    private long activeSubscriptions;
    private BigDecimal monthlyEstimatedCost;
    private BigDecimal yearlyEstimatedCost;
    private long upcomingRenewalsCount;
}
