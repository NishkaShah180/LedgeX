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
public class MonthlyTrendResponse {

    private Integer month;
    private Integer year;
    private BigDecimal income;
    private BigDecimal expense;
    private BigDecimal netBalance;
}
