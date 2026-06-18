package com.ledgex.budget.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BudgetUtilizationResponse {

    private String category;
    private BigDecimal budgetLimit;
    private BigDecimal amountSpent;
    private BigDecimal remainingAmount;
    private BigDecimal utilizationPercentage;
}
