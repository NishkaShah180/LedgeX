package com.ledgex.transaction.service;

import com.ledgex.auth.entity.User;
import com.ledgex.auth.repository.UserRepository;
import com.ledgex.common.exception.ResourceNotFoundException;
import com.ledgex.transaction.dto.TransactionRequest;
import com.ledgex.transaction.dto.TransactionResponse;
import com.ledgex.transaction.entity.Transaction;
import com.ledgex.transaction.enums.TransactionType;
import com.ledgex.transaction.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;

    @Transactional
    public TransactionResponse create(String userEmail, TransactionRequest request) {
        User user = getUserByEmail(userEmail);

        Transaction transaction = Transaction.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .amount(request.getAmount())
                .type(request.getType())
                .category(request.getCategory())
                .transactionDate(request.getTransactionDate())
                .user(user)
                .build();

        return mapToResponse(transactionRepository.save(transaction));
    }

    @Transactional(readOnly = true)
    public List<TransactionResponse> getAll(String userEmail) {
        User user = getUserByEmail(userEmail);
        return transactionRepository.findByUserIdOrderByTransactionDateDesc(user.getId())
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<TransactionResponse> getByType(String userEmail, TransactionType type) {
        User user = getUserByEmail(userEmail);
        return transactionRepository.findByUserIdAndTypeOrderByTransactionDateDesc(user.getId(), type)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public TransactionResponse getById(String userEmail, Long id) {
        User user = getUserByEmail(userEmail);
        Transaction transaction = findTransactionByIdAndUser(id, user.getId());
        return mapToResponse(transaction);
    }

    @Transactional
    public TransactionResponse update(String userEmail, Long id, TransactionRequest request) {
        User user = getUserByEmail(userEmail);
        Transaction transaction = findTransactionByIdAndUser(id, user.getId());

        transaction.setTitle(request.getTitle());
        transaction.setDescription(request.getDescription());
        transaction.setAmount(request.getAmount());
        transaction.setType(request.getType());
        transaction.setCategory(request.getCategory());
        transaction.setTransactionDate(request.getTransactionDate());

        return mapToResponse(transactionRepository.save(transaction));
    }

    @Transactional
    public void delete(String userEmail, Long id) {
        User user = getUserByEmail(userEmail);
        Transaction transaction = findTransactionByIdAndUser(id, user.getId());
        transactionRepository.delete(transaction);
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private Transaction findTransactionByIdAndUser(Long id, Long userId) {
        return transactionRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found"));
    }

    private TransactionResponse mapToResponse(Transaction transaction) {
        return TransactionResponse.builder()
                .id(transaction.getId())
                .title(transaction.getTitle())
                .description(transaction.getDescription())
                .amount(transaction.getAmount())
                .type(transaction.getType())
                .category(transaction.getCategory())
                .transactionDate(transaction.getTransactionDate())
                .createdAt(transaction.getCreatedAt())
                .updatedAt(transaction.getUpdatedAt())
                .build();
    }
}
