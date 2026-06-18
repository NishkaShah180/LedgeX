package com.ledgex.budget.controller;

import com.ledgex.budget.dto.BudgetRequest;
import com.ledgex.budget.dto.BudgetResponse;
import com.ledgex.budget.dto.BudgetUtilizationResponse;
import com.ledgex.budget.service.BudgetService;
import com.ledgex.common.dto.ApiResponse;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/budgets")
@RequiredArgsConstructor
@Tag(name = "Budgets", description = "Budget planning and utilization tracking")
@SecurityRequirement(name = "Bearer Authentication")
public class BudgetController {

    private final BudgetService budgetService;

    @PostMapping
    @Operation(summary = "Create a new budget")
    public ResponseEntity<ApiResponse<BudgetResponse>> create(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody BudgetRequest request
    ) {
        BudgetResponse response = budgetService.create(userDetails.getUsername(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Budget created successfully", response));
    }

    @GetMapping
    @Operation(summary = "Get all budgets for the authenticated user")
    public ResponseEntity<ApiResponse<List<BudgetResponse>>> getAll(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        List<BudgetResponse> responses = budgetService.getAll(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @GetMapping("/utilization")
    @Operation(summary = "Get budget utilization based on expense transactions")
    public ResponseEntity<ApiResponse<List<BudgetUtilizationResponse>>> getUtilization(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer year
    ) {
        List<BudgetUtilizationResponse> responses = budgetService.getUtilization(
                userDetails.getUsername(), month, year
        );
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a budget by ID")
    public ResponseEntity<ApiResponse<BudgetResponse>> getById(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id
    ) {
        BudgetResponse response = budgetService.getById(userDetails.getUsername(), id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a budget")
    public ResponseEntity<ApiResponse<BudgetResponse>> update(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id,
            @Valid @RequestBody BudgetRequest request
    ) {
        BudgetResponse response = budgetService.update(userDetails.getUsername(), id, request);
        return ResponseEntity.ok(ApiResponse.success("Budget updated successfully", response));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a budget")
    public ResponseEntity<ApiResponse<Void>> delete(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id
    ) {
        budgetService.delete(userDetails.getUsername(), id);
        return ResponseEntity.ok(ApiResponse.success("Budget deleted successfully", null));
    }
}
