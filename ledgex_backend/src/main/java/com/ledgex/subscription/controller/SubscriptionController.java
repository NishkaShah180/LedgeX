package com.ledgex.subscription.controller;

import com.ledgex.common.dto.ApiResponse;
import com.ledgex.subscription.dto.SubscriptionRequest;
import com.ledgex.subscription.dto.SubscriptionResponse;
import com.ledgex.subscription.dto.SubscriptionSummaryResponse;
import com.ledgex.subscription.service.SubscriptionService;
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
@RequestMapping("/api/v1/subscriptions")
@RequiredArgsConstructor
@Tag(name = "Subscriptions", description = "Recurring subscription billing management")
@SecurityRequirement(name = "Bearer Authentication")
public class SubscriptionController {

    private final SubscriptionService subscriptionService;

    @PostMapping
    @Operation(summary = "Create a new subscription")
    public ResponseEntity<ApiResponse<SubscriptionResponse>> create(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody SubscriptionRequest request
    ) {
        SubscriptionResponse response = subscriptionService.create(userDetails.getUsername(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Subscription created successfully", response));
    }

    @GetMapping
    @Operation(summary = "Get all subscriptions for the authenticated user")
    public ResponseEntity<ApiResponse<List<SubscriptionResponse>>> getAll(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        List<SubscriptionResponse> responses = subscriptionService.getAll(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @GetMapping("/active")
    @Operation(summary = "Get active subscriptions for the authenticated user")
    public ResponseEntity<ApiResponse<List<SubscriptionResponse>>> getActive(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        List<SubscriptionResponse> responses = subscriptionService.getActive(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @GetMapping("/summary")
    @Operation(summary = "Get subscription cost summary for the authenticated user")
    public ResponseEntity<ApiResponse<SubscriptionSummaryResponse>> getSummary(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        SubscriptionSummaryResponse response = subscriptionService.getSummary(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/upcoming")
    @Operation(summary = "Get active subscriptions with billing due within the next N days")
    public ResponseEntity<ApiResponse<List<SubscriptionResponse>>> getUpcoming(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "7") int days
    ) {
        List<SubscriptionResponse> responses = subscriptionService.getUpcoming(userDetails.getUsername(), days);
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a subscription by ID")
    public ResponseEntity<ApiResponse<SubscriptionResponse>> getById(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id
    ) {
        SubscriptionResponse response = subscriptionService.getById(userDetails.getUsername(), id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a subscription")
    public ResponseEntity<ApiResponse<SubscriptionResponse>> update(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id,
            @Valid @RequestBody SubscriptionRequest request
    ) {
        SubscriptionResponse response = subscriptionService.update(userDetails.getUsername(), id, request);
        return ResponseEntity.ok(ApiResponse.success("Subscription updated successfully", response));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a subscription")
    public ResponseEntity<ApiResponse<Void>> delete(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id
    ) {
        subscriptionService.delete(userDetails.getUsername(), id);
        return ResponseEntity.ok(ApiResponse.success("Subscription deleted successfully", null));
    }
}
