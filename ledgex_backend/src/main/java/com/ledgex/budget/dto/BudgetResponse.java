package com.ledgex.budget.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BudgetResponse {

    private Long id;
    private String category;
    private BigDecimal monthlyLimit;
    private Integer month;
    private Integer year;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
