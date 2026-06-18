package com.ledgex.savings.service;

import com.ledgex.auth.entity.User;
import com.ledgex.auth.repository.UserRepository;
import com.ledgex.common.exception.BadRequestException;
import com.ledgex.common.exception.ResourceNotFoundException;
import com.ledgex.savings.dto.ContributionRequest;
import com.ledgex.savings.dto.SavingsGoalRequest;
import com.ledgex.savings.dto.SavingsGoalResponse;
import com.ledgex.savings.dto.SavingsGoalSummaryResponse;
import com.ledgex.savings.entity.SavingsGoal;
import com.ledgex.savings.enums.SavingsGoalStatus;
import com.ledgex.savings.repository.SavingsGoalRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SavingsGoalService {

    private final SavingsGoalRepository savingsGoalRepository;
    private final UserRepository userRepository;

    @Transactional
    public SavingsGoalResponse create(String userEmail, SavingsGoalRequest request) {
        User user = getUserByEmail(userEmail);

        SavingsGoal goal = SavingsGoal.builder()
                .user(user)
                .name(request.getName())
                .targetAmount(request.getTargetAmount())
                .savedAmount(BigDecimal.ZERO)
                .targetDate(request.getTargetDate())
                .status(SavingsGoalStatus.IN_PROGRESS)
                .build();

        return mapToResponse(savingsGoalRepository.save(goal));
    }

    @Transactional(readOnly = true)
    public List<SavingsGoalResponse> getAll(String userEmail) {
        User user = getUserByEmail(userEmail);
        return savingsGoalRepository.findByUserIdOrderByTargetDateAsc(user.getId())
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public SavingsGoalSummaryResponse getSummary(String userEmail) {
        User user = getUserByEmail(userEmail);
        List<SavingsGoal> goals = savingsGoalRepository.findByUserIdOrderByTargetDateAsc(user.getId());

        long activeGoals = 0;
        long completedGoals = 0;
        long cancelledGoals = 0;
        BigDecimal totalTargetAmount = BigDecimal.ZERO;
        BigDecimal totalSavedAmount = BigDecimal.ZERO;

        for (SavingsGoal goal : goals) {
            switch (goal.getStatus()) {
                case IN_PROGRESS -> activeGoals++;
                case COMPLETED -> completedGoals++;
                case CANCELLED -> cancelledGoals++;
            }
            totalTargetAmount = totalTargetAmount.add(goal.getTargetAmount());
            totalSavedAmount = totalSavedAmount.add(goal.getSavedAmount());
        }

        return SavingsGoalSummaryResponse.builder()
                .totalGoals(goals.size())
                .activeGoals(activeGoals)
                .completedGoals(completedGoals)
                .cancelledGoals(cancelledGoals)
                .totalTargetAmount(totalTargetAmount)
                .totalSavedAmount(totalSavedAmount)
                .build();
    }

    @Transactional(readOnly = true)
    public SavingsGoalResponse getById(String userEmail, Long id) {
        User user = getUserByEmail(userEmail);
        SavingsGoal goal = findGoalByIdAndUser(id, user.getId());
        return mapToResponse(goal);
    }

    @Transactional
    public SavingsGoalResponse update(String userEmail, Long id, SavingsGoalRequest request) {
        User user = getUserByEmail(userEmail);
        SavingsGoal goal = findGoalByIdAndUser(id, user.getId());

        goal.setName(request.getName());
        goal.setTargetAmount(request.getTargetAmount());
        goal.setTargetDate(request.getTargetDate());

        if (request.getStatus() != null) {
            goal.setStatus(request.getStatus());
        }

        return mapToResponse(savingsGoalRepository.save(goal));
    }

    @Transactional
    public void delete(String userEmail, Long id) {
        User user = getUserByEmail(userEmail);
        SavingsGoal goal = findGoalByIdAndUser(id, user.getId());
        savingsGoalRepository.delete(goal);
    }

    @Transactional
    public SavingsGoalResponse contribute(String userEmail, Long id, ContributionRequest request) {
        User user = getUserByEmail(userEmail);
        SavingsGoal goal = findGoalByIdAndUser(id, user.getId());

        if (goal.getStatus() == SavingsGoalStatus.CANCELLED) {
            throw new BadRequestException("Cannot contribute to a cancelled savings goal");
        }

        validateContributionAmount(request.getAmount());

        BigDecimal newSavedAmount = goal.getSavedAmount().add(request.getAmount());
        goal.setSavedAmount(newSavedAmount);

        if (newSavedAmount.compareTo(goal.getTargetAmount()) >= 0) {
            goal.setStatus(SavingsGoalStatus.COMPLETED);
        }

        return mapToResponse(savingsGoalRepository.save(goal));
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private SavingsGoal findGoalByIdAndUser(Long id, Long userId) {
        return savingsGoalRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Savings goal not found"));
    }

    private void validateContributionAmount(BigDecimal amount) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Contribution amount must be greater than zero");
        }
    }

    private BigDecimal calculateProgressPercentage(SavingsGoal goal) {
        if (goal.getSavedAmount().compareTo(goal.getTargetAmount()) >= 0) {
            return BigDecimal.valueOf(100).setScale(2, RoundingMode.HALF_UP);
        }
        return goal.getSavedAmount()
                .multiply(BigDecimal.valueOf(100))
                .divide(goal.getTargetAmount(), 2, RoundingMode.HALF_UP);
    }

    private SavingsGoalResponse mapToResponse(SavingsGoal goal) {
        return SavingsGoalResponse.builder()
                .id(goal.getId())
                .name(goal.getName())
                .targetAmount(goal.getTargetAmount())
                .savedAmount(goal.getSavedAmount())
                .targetDate(goal.getTargetDate())
                .status(goal.getStatus())
                .progressPercentage(calculateProgressPercentage(goal))
                .createdAt(goal.getCreatedAt())
                .updatedAt(goal.getUpdatedAt())
                .build();
    }
}
