package com.ledgex.ai.gemini.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GeminiResponseDTO {

    private String financialSummary;
    private List<String> recommendations;
    private List<String> risks;
    private List<String> savingsAdvice;
    private List<String> budgetAdvice;
}
