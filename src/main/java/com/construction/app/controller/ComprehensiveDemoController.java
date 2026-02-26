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
import java.util.Random;

@RestController
@RequestMapping("/api/comprehensive-demo")
public class ComprehensiveDemoController {

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/create-full-chart-data")
    @PreAuthorize("hasRole('DIRECTOR')")
    public ResponseEntity<String> createFullChartData() {
        List<User> workers = userRepository.findByRole(com.construction.app.enums.UserRole.WORKER);
        
        if (workers.isEmpty()) {
            return ResponseEntity.ok("No workers found!");
        }

        User worker = workers.get(0);
        LocalDateTime now = LocalDateTime.now();
        Random random = new Random();
        
        // Create transactions for the past 24 hours to show a full chart
        int transactionsCreated = 0;
        
        for (int hoursAgo = 23; hoursAgo >= 0; hoursAgo--) {
            LocalDateTime transactionTime = now.minusHours(hoursAgo);
            
            // Create 1-2 transactions per hour
            int transactionsInHour = 1 + random.nextInt(2);
            for (int i = 0; i < transactionsInHour; i++) {
                TransactionType type = random.nextBoolean() ? TransactionType.INCOME : TransactionType.SPENDING;
                BigDecimal amount = new BigDecimal(100 + random.nextInt(2000) + random.nextDouble());
                
                createTransactionAtTime(worker, 
                    "Transaction " + (transactionsCreated + 1) + " (" + hoursAgo + "h ago)",
                    type, 
                    transactionTime, 
                    amount);
                transactionsCreated++;
            }
        }
        
        return ResponseEntity.ok("Created " + transactionsCreated + " transactions across the past 24 hours!");
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
        transaction.setSource("Demo Source");
        transaction.setDescription("Demo transaction for " + product);
        transaction.setWeightKg(new BigDecimal(50 + new Random().nextInt(100)));
        transaction.setCreatedAt(createdAt);
        transaction.setManager(worker.getAssignedManager());
        
        transactionRepository.save(transaction);
    }
}
