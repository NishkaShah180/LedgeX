package com.ledgex.analytics.dto;

import com.ledgex.analytics.enums.HealthRating;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FinancialHealthScoreResponse {

    private int score;
    private HealthRating rating;
    private String explanation;
}
