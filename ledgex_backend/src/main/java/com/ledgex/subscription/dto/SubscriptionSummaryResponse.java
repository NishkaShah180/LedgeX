package com.ledgex.subscription.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubscriptionSummaryResponse {

    private long totalSubscriptions;
    private long activeSubscriptions;
    private BigDecimal monthlyEstimatedCost;
    private BigDecimal yearlyEstimatedCost;
}
