package com.construction.app.controller;

import com.construction.app.dto.PagedResponse;
import com.construction.app.dto.ReviewTransactionRequest;
import com.construction.app.dto.StatisticResponse;
import com.construction.app.dto.TransactionRequest;
import com.construction.app.dto.TransactionResponse;
import com.construction.app.entity.Transaction;
import com.construction.app.enums.TransactionStatus;
import com.construction.app.repository.UserRepository;
import com.construction.app.service.StatisticService;
import com.construction.app.service.TransactionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/transactions")
public class TransactionController {
    @Autowired
    private TransactionService transactionService;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private StatisticService statisticService;

    @PostMapping("/create")
    public ResponseEntity<TransactionResponse> createTransaction(@RequestBody TransactionRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();

        Long workerId = userRepository.findByUsername(username)
                .map(u -> u.getId())
                .orElseThrow(() -> new RuntimeException("Authenticated user not found"));

        Transaction transaction = transactionService.createTransaction(workerId, request);

        TransactionResponse response = new TransactionResponse();
        response.setId(transaction.getId());
        response.setWorkerId(transaction.getWorker().getId());
        response.setWorkerName(transaction.getWorker().getFullName());
        response.setType(transaction.getType().toString());
        response.setStatus(transaction.getStatus().toString());
        response.setAmount(transaction.getAmount().toString());
        response.setCurrency(transaction.getCurrency());
        response.setProduct(transaction.getProduct());
        response.setSource(transaction.getSource());
        response.setDescription(transaction.getDescription());
        response.setWeightKg(transaction.getWeightKg().toString());

        if (transaction.getManager() != null) {
            response.setManagerId(transaction.getManager().getId());
            response.setManagerName(transaction.getManager().getFullName());
        }

        return ResponseEntity.ok(response);
    }

    @GetMapping("/my-transactions")
    public ResponseEntity<List<TransactionResponse>> getMyTransactions() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        Long workerId = userRepository.findByUsername(username)
                .map(u -> u.getId())
                .orElseThrow(() -> new RuntimeException("Authenticated user not found"));

        List<TransactionResponse> transactions = transactionService.getWorkerTransactions(workerId);
        return ResponseEntity.ok(transactions);
    }

    @GetMapping("/pending")
    public ResponseEntity<List<TransactionResponse>> getPendingTransactions() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        Long managerId = userRepository.findByUsername(username)
                .map(u -> u.getId())
                .orElseThrow(() -> new RuntimeException("Authenticated user not found"));

        List<TransactionResponse> transactions = transactionService.getManagerPendingTransactions(managerId);
        return ResponseEntity.ok(transactions);
    }

    @GetMapping("/all")
    public ResponseEntity<List<TransactionResponse>> getAllTransactions() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        Long managerId = userRepository.findByUsername(username)
                .map(u -> u.getId())
                .orElseThrow(() -> new RuntimeException("Authenticated user not found"));

        List<TransactionResponse> transactions = transactionService.getManagerAllTransactions(managerId);
        return ResponseEntity.ok(transactions);
    }

    @GetMapping("/all-accepted")
    public ResponseEntity<List<TransactionResponse>> getAllAcceptedTransactions() {
        List<TransactionResponse> transactions = transactionService.getAllAcceptedTransactions();
        return ResponseEntity.ok(transactions);
    }

    @GetMapping("/all-accepted-paginated")
    public ResponseEntity<PagedResponse<TransactionResponse>> getAllAcceptedTransactionsPaginated(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PagedResponse<TransactionResponse> transactions = transactionService.getAllAcceptedTransactionsPaginated(page,
                size);
        return ResponseEntity.ok(transactions);
    }

    @PutMapping("/{id}/review")
    public ResponseEntity<TransactionResponse> reviewTransaction(
            @PathVariable Long id,
            @RequestBody ReviewTransactionRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();

        Long managerId = userRepository.findByUsername(username)
                .map(u -> u.getId())
                .orElseThrow(() -> new RuntimeException("Authenticated user not found"));

        Transaction transaction = transactionService.reviewTransaction(id, managerId, request);

        TransactionResponse response = new TransactionResponse();
        response.setId(transaction.getId());
        response.setStatus(transaction.getStatus().toString());
        response.setManagerId(transaction.getManager().getId());
        response.setManagerName(transaction.getManager().getFullName());
        response.setManagerComment(transaction.getManagerComment());
        response.setReviewedAt(transaction.getReviewedAt().toString());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/history")
    public ResponseEntity<List<TransactionResponse>> getWorkerHistory(
            @RequestParam(defaultValue = "ALL") String status) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        Long workerId = userRepository.findByUsername(username)
                .map(u -> u.getId())
                .orElseThrow(() -> new RuntimeException("Authenticated user not found"));

        List<TransactionResponse> transactions;

        if ("ALL".equals(status)) {
            transactions = transactionService.getWorkerTransactions(workerId);
        } else {
            TransactionStatus transactionStatus = mapStatusStringToEnum(status);
            transactions = transactionService.getWorkerTransactionsByStatus(workerId, transactionStatus);
        }

        return ResponseEntity.ok(transactions);
    }

    @GetMapping("/director-filtered")
    public ResponseEntity<PagedResponse<TransactionResponse>> getDirectorFilteredTransactions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String workerUsername) {

        // Only allow directors to access this endpoint
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        boolean isDirector = authentication.getAuthorities().stream()
                .anyMatch(auth -> auth.getAuthority().equals("ROLE_DIRECTOR"));

        if (!isDirector) {
            return ResponseEntity.status(403).build();
        }

        PagedResponse<TransactionResponse> transactions = transactionService.getDirectorFilteredTransactions(
                page, size, status, workerUsername);
        return ResponseEntity.ok(transactions);
    }

    @GetMapping("/manager-history")
    public ResponseEntity<List<TransactionResponse>> getManagerHistory(
            @RequestParam(defaultValue = "ALL") String status) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        Long managerId = userRepository.findByUsername(username)
                .map(u -> u.getId())
                .orElseThrow(() -> new RuntimeException("Authenticated user not found"));

        List<TransactionResponse> transactions;

        if ("ALL".equals(status)) {
            transactions = transactionService.getManagerAllTransactions(managerId);
        } else {
            TransactionStatus transactionStatus = mapStatusStringToEnum(status);
            transactions = transactionService.getManagerTransactionsByStatus(managerId, transactionStatus);
        }

        return ResponseEntity.ok(transactions);
    }

    @GetMapping("/statistics")
    public ResponseEntity<StatisticResponse> getStatistics() {
        StatisticResponse current = statisticService.getCurrentStatistics();
        return ResponseEntity.ok(current);
    }

    @GetMapping("/statistics/history")
    public ResponseEntity<List<StatisticResponse>> getStatisticsHistory(@RequestParam(defaultValue = "30") int days) {
        List<StatisticResponse> history = statisticService.getStatisticHistory(days);
        return ResponseEntity.ok(history);
    }

    @GetMapping("/director/all-pending")
    public ResponseEntity<List<TransactionResponse>> getDirectorAllPending() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        boolean isDirector = authentication.getAuthorities().stream()
                .anyMatch(auth -> auth.getAuthority().equals("ROLE_DIRECTOR"));
        if (!isDirector)
            return ResponseEntity.status(403).build();
        return ResponseEntity.ok(transactionService.getAllPendingTransactions());
    }

    @GetMapping("/director/all-rejected")
    public ResponseEntity<List<TransactionResponse>> getDirectorAllRejected() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        boolean isDirector = authentication.getAuthorities().stream()
                .anyMatch(auth -> auth.getAuthority().equals("ROLE_DIRECTOR"));
        if (!isDirector)
            return ResponseEntity.status(403).build();
        return ResponseEntity.ok(transactionService.getAllRejectedTransactions());
    }

    @GetMapping("/director/summary-stats")
    public ResponseEntity<Map<String, Long>> getDirectorSummaryStats() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        boolean isDirector = authentication.getAuthorities().stream()
                .anyMatch(auth -> auth.getAuthority().equals("ROLE_DIRECTOR"));
        if (!isDirector)
            return ResponseEntity.status(403).build();
        return ResponseEntity.ok(transactionService.getDirectorSummaryStats());
    }

    @GetMapping("/statistics/today-hourly")
    public ResponseEntity<List<Map<String, Object>>> getTodayHourlyGrowth() {
        List<Map<String, Object>> hourlyData = statisticService.getTodayHourlyGrowth();
        return ResponseEntity.ok(hourlyData);
    }

    private TransactionStatus mapStatusStringToEnum(String status) {
        switch (status.toUpperCase()) {
            case "ACCEPTED":
                return TransactionStatus.ACCEPTED;
            case "REJECTED":
                return TransactionStatus.REJECTED;
            case "RETURNED":
                return TransactionStatus.COMMENTED;
            case "PENDING":
                return TransactionStatus.PENDING;
            default:
                return TransactionStatus.PENDING;
        }
    }
}
