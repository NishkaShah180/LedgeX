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
public class CategorySpendingResponse {

    private String category;
    private BigDecimal amount;
    private BigDecimal percentage;
}
