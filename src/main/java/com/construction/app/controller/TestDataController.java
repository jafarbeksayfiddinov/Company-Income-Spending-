package com.construction.app.controller;

import com.construction.app.entity.Transaction;
import com.construction.app.entity.User;
import com.construction.app.enums.TransactionStatus;
import com.construction.app.enums.TransactionType;
import com.construction.app.repository.TransactionRepository;
import com.construction.app.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/test")
public class TestDataController {

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/create-hourly-test-data")
    @PreAuthorize("hasRole('DIRECTOR')")
    public ResponseEntity<String> createHourlyTestData() {
        List<User> workers = userRepository.findByRole(com.construction.app.enums.UserRole.WORKER);
        
        if (workers.isEmpty()) {
            return ResponseEntity.ok("No workers found!");
        }

        User worker = workers.get(0); // Use first worker
        LocalDateTime today = LocalDateTime.now();
        
        // Create transactions at current hour and recent past hours
        createTransactionAtTime(worker, "Current Hour Income", TransactionType.INCOME, 
            today, new BigDecimal("800.00"));
        
        // 2 hours ago (if current hour >= 2)
        if (today.getHour() >= 2) {
            createTransactionAtTime(worker, "2 Hours Ago Income", TransactionType.INCOME, 
                today.minusHours(2), new BigDecimal("1200.00"));
        }
        
        // 4 hours ago (if current hour >= 4)
        if (today.getHour() >= 4) {
            createTransactionAtTime(worker, "4 Hours Ago Spending", TransactionType.SPENDING, 
                today.minusHours(4), new BigDecimal("300.00"));
        }
        
        // 6 hours ago (if current hour >= 6)
        if (today.getHour() >= 6) {
            createTransactionAtTime(worker, "6 Hours Ago Income", TransactionType.INCOME, 
                today.minusHours(6), new BigDecimal("1500.00"));
        }
        
        // 8 hours ago (if current hour >= 8)
        if (today.getHour() >= 8) {
            createTransactionAtTime(worker, "8 Hours Ago Spending", TransactionType.SPENDING, 
                today.minusHours(8), new BigDecimal("450.00"));
        }
        
        // 10 hours ago (if current hour >= 10)
        if (today.getHour() >= 10) {
            createTransactionAtTime(worker, "10 Hours Ago Income", TransactionType.INCOME, 
                today.minusHours(10), new BigDecimal("600.00"));
        }
        
        return ResponseEntity.ok("Created test transactions at recent hours today!");
    }

    private void createTransactionAtTime(User worker, String product, TransactionType type, 
                                       LocalDateTime createdAt, BigDecimal amount) {
        Transaction transaction = new Transaction();
        transaction.setWorker(worker);
        transaction.setType(type);
        transaction.setStatus(TransactionStatus.ACCEPTED);
        transaction.setAmount(amount);
        transaction.setCurrency("UZS");
        transaction.setProduct(product);
        transaction.setSource("Test Source");
        transaction.setDescription("Test transaction for " + product);
        transaction.setWeightKg(new BigDecimal("50"));
        transaction.setCreatedAt(createdAt);
        transaction.setManager(worker.getAssignedManager());
        
        transactionRepository.save(transaction);
    }
}
