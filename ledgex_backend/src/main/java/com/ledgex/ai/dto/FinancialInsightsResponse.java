package com.ledgex.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FinancialInsightsResponse {

    private int financialHealthScore;
    private String topInsight;
    private List<String> recommendations;
    private List<String> warnings;
    private List<String> achievements;
}
