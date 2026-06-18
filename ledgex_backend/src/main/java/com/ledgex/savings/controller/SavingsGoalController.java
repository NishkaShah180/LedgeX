package com.ledgex.savings.controller;

import com.ledgex.common.dto.ApiResponse;
import com.ledgex.savings.dto.ContributionRequest;
import com.ledgex.savings.dto.SavingsGoalRequest;
import com.ledgex.savings.dto.SavingsGoalResponse;
import com.ledgex.savings.dto.SavingsGoalSummaryResponse;
import com.ledgex.savings.service.SavingsGoalService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/savings-goals")
@RequiredArgsConstructor
@Tag(name = "Savings Goals", description = "Savings target and progress management")
@SecurityRequirement(name = "Bearer Authentication")
public class SavingsGoalController {

    private final SavingsGoalService savingsGoalService;

    @PostMapping
    @Operation(summary = "Create a new savings goal")
    public ResponseEntity<ApiResponse<SavingsGoalResponse>> create(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody SavingsGoalRequest request
    ) {
        SavingsGoalResponse response = savingsGoalService.create(userDetails.getUsername(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Savings goal created successfully", response));
    }

    @GetMapping
    @Operation(summary = "Get all savings goals for the authenticated user")
    public ResponseEntity<ApiResponse<List<SavingsGoalResponse>>> getAll(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        List<SavingsGoalResponse> responses = savingsGoalService.getAll(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @GetMapping("/summary")
    @Operation(summary = "Get savings goals summary for the authenticated user")
    public ResponseEntity<ApiResponse<SavingsGoalSummaryResponse>> getSummary(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        SavingsGoalSummaryResponse response = savingsGoalService.getSummary(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a savings goal by ID")
    public ResponseEntity<ApiResponse<SavingsGoalResponse>> getById(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id
    ) {
        SavingsGoalResponse response = savingsGoalService.getById(userDetails.getUsername(), id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a savings goal")
    public ResponseEntity<ApiResponse<SavingsGoalResponse>> update(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id,
            @Valid @RequestBody SavingsGoalRequest request
    ) {
        SavingsGoalResponse response = savingsGoalService.update(userDetails.getUsername(), id, request);
        return ResponseEntity.ok(ApiResponse.success("Savings goal updated successfully", response));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a savings goal")
    public ResponseEntity<ApiResponse<Void>> delete(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id
    ) {
        savingsGoalService.delete(userDetails.getUsername(), id);
        return ResponseEntity.ok(ApiResponse.success("Savings goal deleted successfully", null));
    }

    @PostMapping("/{id}/contribute")
    @Operation(summary = "Add a contribution to a savings goal")
    public ResponseEntity<ApiResponse<SavingsGoalResponse>> contribute(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id,
            @Valid @RequestBody ContributionRequest request
    ) {
        SavingsGoalResponse response = savingsGoalService.contribute(userDetails.getUsername(), id, request);
        return ResponseEntity.ok(ApiResponse.success("Contribution added successfully", response));
    }
}
