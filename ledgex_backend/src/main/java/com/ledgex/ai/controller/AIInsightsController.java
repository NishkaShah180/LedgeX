package com.ledgex.ai.controller;

import com.ledgex.ai.dto.FinancialInsightsResponse;
import com.ledgex.ai.service.AIInsightsService;
import com.ledgex.common.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/ai")
@RequiredArgsConstructor
@Tag(name = "AI Insights", description = "Rule-based financial insights and recommendations")
@SecurityRequirement(name = "Bearer Authentication")
public class AIInsightsController {

    private final AIInsightsService aiInsightsService;

    @GetMapping("/financial-insights")
    @Operation(summary = "Get rule-based financial insights for the authenticated user")
    public ResponseEntity<ApiResponse<FinancialInsightsResponse>> getFinancialInsights(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer year
    ) {
        FinancialInsightsResponse response = aiInsightsService.getFinancialInsights(userDetails.getUsername(), month, year);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
