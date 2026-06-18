package com.ledgex.subscription.service;

import com.ledgex.auth.entity.User;
import com.ledgex.auth.repository.UserRepository;
import com.ledgex.common.exception.ResourceNotFoundException;
import com.ledgex.subscription.dto.SubscriptionRequest;
import com.ledgex.subscription.dto.SubscriptionResponse;
import com.ledgex.subscription.dto.SubscriptionSummaryResponse;
import com.ledgex.subscription.entity.Subscription;
import com.ledgex.subscription.repository.SubscriptionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SubscriptionService {

    private final SubscriptionRepository subscriptionRepository;
    private final UserRepository userRepository;

    @Transactional
    public SubscriptionResponse create(String userEmail, SubscriptionRequest request) {
        User user = getUserByEmail(userEmail);

        Subscription subscription = Subscription.builder()
                .user(user)
                .name(request.getName())
                .amount(request.getAmount())
                .billingCycle(request.getBillingCycle())
                .category(request.getCategory())
                .nextBillingDate(request.getNextBillingDate())
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .build();

        return mapToResponse(subscriptionRepository.save(subscription));
    }

    @Transactional(readOnly = true)
    public List<SubscriptionResponse> getAll(String userEmail) {
        User user = getUserByEmail(userEmail);
        return subscriptionRepository.findByUserIdOrderByNextBillingDateAsc(user.getId())
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<SubscriptionResponse> getActive(String userEmail) {
        User user = getUserByEmail(userEmail);
        return subscriptionRepository.findByUserIdAndIsActiveTrueOrderByNextBillingDateAsc(user.getId())
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<SubscriptionResponse> getUpcoming(String userEmail, int days) {
        User user = getUserByEmail(userEmail);
        LocalDate today = LocalDate.now();
        LocalDate endDate = today.plusDays(days);

        return subscriptionRepository.findByUserIdAndIsActiveTrueOrderByNextBillingDateAsc(user.getId())
                .stream()
                .filter(subscription -> {
                    LocalDate nextBillingDate = subscription.getNextBillingDate();
                    return !nextBillingDate.isBefore(today) && !nextBillingDate.isAfter(endDate);
                })
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public SubscriptionSummaryResponse getSummary(String userEmail) {
        User user = getUserByEmail(userEmail);
        List<Subscription> subscriptions = subscriptionRepository.findByUserIdOrderByNextBillingDateAsc(user.getId());

        long activeCount = 0;
        BigDecimal monthlyEstimatedCost = BigDecimal.ZERO;

        for (Subscription subscription : subscriptions) {
            if (subscription.isActive()) {
                activeCount++;
                monthlyEstimatedCost = monthlyEstimatedCost.add(toMonthlyCost(subscription));
            }
        }

        monthlyEstimatedCost = monthlyEstimatedCost.setScale(2, RoundingMode.HALF_UP);
        BigDecimal yearlyEstimatedCost = monthlyEstimatedCost
                .multiply(BigDecimal.valueOf(12))
                .setScale(2, RoundingMode.HALF_UP);

        return SubscriptionSummaryResponse.builder()
                .totalSubscriptions(subscriptions.size())
                .activeSubscriptions(activeCount)
                .monthlyEstimatedCost(monthlyEstimatedCost)
                .yearlyEstimatedCost(yearlyEstimatedCost)
                .build();
    }

    @Transactional(readOnly = true)
    public SubscriptionResponse getById(String userEmail, Long id) {
        User user = getUserByEmail(userEmail);
        Subscription subscription = findSubscriptionByIdAndUser(id, user.getId());
        return mapToResponse(subscription);
    }

    @Transactional
    public SubscriptionResponse update(String userEmail, Long id, SubscriptionRequest request) {
        User user = getUserByEmail(userEmail);
        Subscription subscription = findSubscriptionByIdAndUser(id, user.getId());

        subscription.setName(request.getName());
        subscription.setAmount(request.getAmount());
        subscription.setBillingCycle(request.getBillingCycle());
        subscription.setCategory(request.getCategory());
        subscription.setNextBillingDate(request.getNextBillingDate());

        if (request.getIsActive() != null) {
            subscription.setActive(request.getIsActive());
        }

        return mapToResponse(subscriptionRepository.save(subscription));
    }

    @Transactional
    public void delete(String userEmail, Long id) {
        User user = getUserByEmail(userEmail);
        Subscription subscription = findSubscriptionByIdAndUser(id, user.getId());
        subscriptionRepository.delete(subscription);
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private Subscription findSubscriptionByIdAndUser(Long id, Long userId) {
        return subscriptionRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Subscription not found"));
    }

    private BigDecimal toMonthlyCost(Subscription subscription) {
        BigDecimal amount = subscription.getAmount();
        return switch (subscription.getBillingCycle()) {
            case DAILY -> amount.multiply(BigDecimal.valueOf(30));
            case WEEKLY -> amount.multiply(BigDecimal.valueOf(4));
            case MONTHLY -> amount;
            case YEARLY -> amount.divide(BigDecimal.valueOf(12), 2, RoundingMode.HALF_UP);
        };
    }

    private SubscriptionResponse mapToResponse(Subscription subscription) {
        return SubscriptionResponse.builder()
                .id(subscription.getId())
                .name(subscription.getName())
                .amount(subscription.getAmount())
                .billingCycle(subscription.getBillingCycle())
                .category(subscription.getCategory())
                .nextBillingDate(subscription.getNextBillingDate())
                .isActive(subscription.isActive())
                .createdAt(subscription.getCreatedAt())
                .updatedAt(subscription.getUpdatedAt())
                .build();
    }
}
