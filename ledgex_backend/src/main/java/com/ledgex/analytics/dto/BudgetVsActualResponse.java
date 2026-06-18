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
public class BudgetVsActualResponse {

    private String category;
    private Integer month;
    private Integer year;
    private BigDecimal budgetLimit;
    private BigDecimal actualSpent;
    private BigDecimal remainingAmount;
    private BigDecimal utilizationPercentage;
}
