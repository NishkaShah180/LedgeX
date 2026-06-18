package com.ledgex.savings.dto;

import com.ledgex.savings.enums.SavingsGoalStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SavingsGoalResponse {

    private Long id;
    private String name;
    private BigDecimal targetAmount;
    private BigDecimal savedAmount;
    private LocalDate targetDate;
    private SavingsGoalStatus status;
    private BigDecimal progressPercentage;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
