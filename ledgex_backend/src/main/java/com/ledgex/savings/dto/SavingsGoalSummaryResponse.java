package com.ledgex.savings.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SavingsGoalSummaryResponse {

    private long totalGoals;
    private long activeGoals;
    private long completedGoals;
    private long cancelledGoals;
    private BigDecimal totalTargetAmount;
    private BigDecimal totalSavedAmount;
}
