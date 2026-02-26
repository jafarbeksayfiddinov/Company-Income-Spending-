package com.construction.app.service;

import com.construction.app.dto.PagedResponse;
import com.construction.app.dto.ReviewTransactionRequest;
import com.construction.app.dto.TransactionRequest;
import com.construction.app.dto.TransactionResponse;
import com.construction.app.entity.Transaction;
import com.construction.app.entity.User;
import com.construction.app.enums.TransactionStatus;
import com.construction.app.enums.TransactionType;
import com.construction.app.repository.TransactionRepository;
import com.construction.app.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class TransactionService {
    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NotificationService notificationService;

    public Transaction createTransaction(Long workerId, TransactionRequest request) {
        Optional<User> workerOptional = userRepository.findById(workerId);
        if (workerOptional.isEmpty()) {
            throw new RuntimeException("Worker not found");
        }

        User worker = workerOptional.get();

        Transaction transaction = new Transaction();
        transaction.setWorker(worker);
        transaction.setType(TransactionType.valueOf(request.getType()));
        transaction.setStatus(TransactionStatus.PENDING);
        transaction.setAmount(new BigDecimal(request.getAmount()));
        transaction.setCurrency(request.getCurrency());
        transaction.setProduct(request.getProduct());
        transaction.setSource(request.getSource());
        transaction.setDescription(request.getDescription());
        transaction.setWeightKg(new BigDecimal(request.getWeightKg()));
        transaction.setCreatedAt(LocalDateTime.now());
        transaction.setManager(worker.getAssignedManager());
        Transaction savedTransaction = transactionRepository.save(transaction);

        // Notify manager when worker submits a new transaction
        if (worker.getAssignedManager() != null) {
            notificationService.createNotification(
                    worker.getAssignedManager().getId(),
                    "NEW_TRANSACTION",
                    savedTransaction.getId(),
                    "New transaction from " + worker.getFullName());
        }

        return savedTransaction;
    }

    public List<TransactionResponse> getWorkerTransactions(Long workerId) {
        List<Transaction> transactions = transactionRepository.findByWorkerIdOrderByCreatedAtDesc(workerId);
        return transactions.stream().map(this::convertToResponse).collect(Collectors.toList());
    }

    public List<TransactionResponse> getWorkerTransactionsByStatus(Long workerId, TransactionStatus status) {
        List<Transaction> transactions = transactionRepository.findByWorkerIdAndStatusOrderByCreatedAtDesc(workerId,
                status);
        return transactions.stream().map(this::convertToResponse).collect(Collectors.toList());
    }

    public List<TransactionResponse> getManagerPendingTransactions(Long managerId) {
        List<Transaction> transactions = transactionRepository
                .findByManagerIdAndStatus(managerId, TransactionStatus.PENDING);
        return transactions.stream().map(this::convertToResponse).collect(Collectors.toList());
    }

    public List<TransactionResponse> getManagerAllTransactions(Long managerId) {
        List<Transaction> transactions = transactionRepository
                .findByManagerIdOrderByCreatedAtDesc(managerId);
        return transactions.stream().map(this::convertToResponse).collect(Collectors.toList());
    }

    public List<TransactionResponse> getManagerTransactionsByStatus(Long managerId, TransactionStatus status) {
        List<Transaction> transactions = transactionRepository
                .findByManagerIdAndStatusOrderByCreatedAtDesc(managerId, status);
        return transactions.stream().map(this::convertToResponse).collect(Collectors.toList());
    }

    public List<TransactionResponse> getAllAcceptedTransactions() {
        List<Transaction> transactions = transactionRepository
                .findByStatusOrderByCreatedAtDesc(TransactionStatus.ACCEPTED);
        return transactions.stream().map(this::convertToResponse).collect(Collectors.toList());
    }

    public PagedResponse<TransactionResponse> getAllAcceptedTransactionsPaginated(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Transaction> transactionPage = transactionRepository
                .findByStatusOrderByCreatedAtDesc(TransactionStatus.ACCEPTED, pageable);

        List<TransactionResponse> content = transactionPage.getContent()
                .stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());

        return new PagedResponse<>(
                content,
                transactionPage.getNumber(),
                transactionPage.getSize(),
                transactionPage.getTotalElements());
    }

    public Transaction reviewTransaction(Long transactionId, Long managerId, ReviewTransactionRequest request) {
        Optional<Transaction> transactionOptional = transactionRepository.findById(transactionId);
        if (transactionOptional.isEmpty()) {
            throw new RuntimeException("Transaction not found");
        }

        Transaction transaction = transactionOptional.get();

        // Map action to status: ACCEPT -> ACCEPTED, REJECT -> REJECTED, COMMENT ->
        // COMMENTED
        String action = request.getAction();
        String notificationType = action;

        if ("ACCEPT".equals(action)) {
            transaction.setStatus(TransactionStatus.ACCEPTED);
        } else if ("REJECT".equals(action)) {
            transaction.setStatus(TransactionStatus.REJECTED);
        } else if ("COMMENT".equals(action)) {
            transaction.setStatus(TransactionStatus.COMMENTED);
        }

        // Set the manager who is reviewing
        transaction.setManager(userRepository.findById(managerId).orElse(null));
        transaction.setManagerComment(request.getComment());
        transaction.setReviewedAt(LocalDateTime.now());

        Transaction savedTransaction = transactionRepository.save(transaction);

        // Create notification for the worker
        Long workerId = transaction.getWorker().getId();
        String message = buildNotificationMessage(action, request.getComment());
        notificationService.createNotification(workerId, notificationType, transactionId, message);

        return savedTransaction;
    }

    private String buildNotificationMessage(String action, String comment) {
        switch (action) {
            case "ACCEPT":
                return "Your transaction has been accepted";
            case "REJECT":
                return "Your transaction has been rejected";
            case "COMMENT":
                return "Manager left a comment: " + (comment != null ? comment : "");
            default:
                return "Transaction has been reviewed";
        }
    }

    private TransactionResponse convertToResponse(Transaction transaction) {
        TransactionResponse response = new TransactionResponse();
        response.setId(transaction.getId());
        response.setWorkerId(transaction.getWorker().getId());
        response.setWorkerName(transaction.getWorker().getFullName());
        if (transaction.getManager() != null) {
            response.setManagerId(transaction.getManager().getId());
            response.setManagerName(transaction.getManager().getFullName());
        }
        response.setType(transaction.getType().toString());
        response.setStatus(transaction.getStatus().toString());
        response.setAmount(transaction.getAmount().toString());
        response.setCurrency(transaction.getCurrency());
        response.setProduct(transaction.getProduct());
        response.setSource(transaction.getSource());
        response.setDescription(transaction.getDescription());
        response.setWeightKg(transaction.getWeightKg().toString());
        response.setManagerComment(transaction.getManagerComment());
        response.setCreatedAt(transaction.getCreatedAt().toString());
        if (transaction.getReviewedAt() != null) {
            response.setReviewedAt(transaction.getReviewedAt().toString());
        }
        return response;
    }

    public PagedResponse<TransactionResponse> getDirectorFilteredTransactions(
            int page, int size, String status, String workerUsername) {

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Transaction> transactionPage;

        if (status != null && !status.isEmpty() && !"all".equalsIgnoreCase(status)) {
            TransactionStatus transactionStatus = TransactionStatus.valueOf(status.toUpperCase());

            if (workerUsername != null && !workerUsername.isEmpty() && !"all".equalsIgnoreCase(workerUsername)) {
                // Both status and worker filter
                transactionPage = transactionRepository.findByStatusAndWorkerUsernameQuery(
                        transactionStatus, workerUsername, pageable);
            } else {
                // Only status filter
                transactionPage = transactionRepository.findByStatusOrderByCreatedAtDesc(
                        transactionStatus, pageable);
            }
        } else if (workerUsername != null && !workerUsername.isEmpty() && !"all".equalsIgnoreCase(workerUsername)) {
            // Only worker filter (all statuses)
            transactionPage = transactionRepository.findByWorkerUsernameQuery(
                    workerUsername, pageable);
        } else {
            // No filters - return all transactions for director
            transactionPage = transactionRepository.findAllByOrderByCreatedAtDesc(pageable);
        }

        List<TransactionResponse> content = transactionPage.getContent()
                .stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());

        return new PagedResponse<>(
                content,
                transactionPage.getNumber(),
                transactionPage.getSize(),
                transactionPage.getTotalElements());
    }

    // Director-scoped system-wide queries
    public List<TransactionResponse> getAllPendingTransactions() {
        List<Transaction> transactions = transactionRepository
                .findByStatusOrderByCreatedAtDesc(TransactionStatus.PENDING);
        return transactions.stream().map(this::convertToResponse).collect(Collectors.toList());
    }

    public List<TransactionResponse> getAllRejectedTransactions() {
        List<Transaction> transactions = transactionRepository
                .findByStatusOrderByCreatedAtDesc(TransactionStatus.REJECTED);
        return transactions.stream().map(this::convertToResponse).collect(Collectors.toList());
    }

    public Map<String, Long> getDirectorSummaryStats() {
        long accepted = transactionRepository.countByStatus(TransactionStatus.ACCEPTED);
        long pending = transactionRepository.countByStatus(TransactionStatus.PENDING);
        long rejected = transactionRepository.countByStatus(TransactionStatus.REJECTED);
        Map<String, Long> stats = new java.util.LinkedHashMap<>();
        stats.put("accepted", accepted);
        stats.put("pending", pending);
        stats.put("rejected", rejected);
        stats.put("total", accepted + pending + rejected);
        return stats;
    }
}
