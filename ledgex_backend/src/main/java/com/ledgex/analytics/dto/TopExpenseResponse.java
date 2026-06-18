package com.ledgex.analytics.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TopExpenseResponse {

    private Long id;
    private String title;
    private BigDecimal amount;
    private String category;
    private LocalDate transactionDate;
}
