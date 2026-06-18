package com.ledgex.ai.gemini.controller;

import com.ledgex.ai.gemini.dto.GeminiResponseDTO;
import com.ledgex.ai.gemini.service.GeminiService;
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
@Tag(name = "Gemini AI Insights", description = "Gemini-powered financial insights that enhance rule-based recommendations")
@SecurityRequirement(name = "Bearer Authentication")
public class GeminiController {

    private final GeminiService geminiService;

    @GetMapping("/gemini-insights")
    @Operation(summary = "Get Gemini-enhanced financial insights for the authenticated user")
    public ResponseEntity<ApiResponse<GeminiResponseDTO>> getGeminiInsights(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        GeminiResponseDTO response = geminiService.getGeminiInsights(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
