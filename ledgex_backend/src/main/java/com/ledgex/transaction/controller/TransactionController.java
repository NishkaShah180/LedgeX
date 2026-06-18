package com.ledgex.transaction.controller;

import com.ledgex.common.dto.ApiResponse;
import com.ledgex.transaction.dto.TransactionRequest;
import com.ledgex.transaction.dto.TransactionResponse;
import com.ledgex.transaction.enums.TransactionType;
import com.ledgex.transaction.service.TransactionService;
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
@RequestMapping("/api/v1/transactions")
@RequiredArgsConstructor
@Tag(name = "Transactions", description = "Income and expense transaction management")
@SecurityRequirement(name = "Bearer Authentication")
public class TransactionController {

    private final TransactionService transactionService;

    @PostMapping
    @Operation(summary = "Create a new transaction")
    public ResponseEntity<ApiResponse<TransactionResponse>> create(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody TransactionRequest request
    ) {
        TransactionResponse response = transactionService.create(userDetails.getUsername(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Transaction created successfully", response));
    }

    @GetMapping
    @Operation(summary = "Get all transactions for the authenticated user")
    public ResponseEntity<ApiResponse<List<TransactionResponse>>> getAll(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) TransactionType type
    ) {
        List<TransactionResponse> responses = type != null
                ? transactionService.getByType(userDetails.getUsername(), type)
                : transactionService.getAll(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a transaction by ID")
    public ResponseEntity<ApiResponse<TransactionResponse>> getById(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id
    ) {
        TransactionResponse response = transactionService.getById(userDetails.getUsername(), id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a transaction")
    public ResponseEntity<ApiResponse<TransactionResponse>> update(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id,
            @Valid @RequestBody TransactionRequest request
    ) {
        TransactionResponse response = transactionService.update(userDetails.getUsername(), id, request);
        return ResponseEntity.ok(ApiResponse.success("Transaction updated successfully", response));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a transaction")
    public ResponseEntity<ApiResponse<Void>> delete(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id
    ) {
        transactionService.delete(userDetails.getUsername(), id);
        return ResponseEntity.ok(ApiResponse.success("Transaction deleted successfully", null));
    }
}
