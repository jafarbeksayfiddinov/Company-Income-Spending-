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
@RequestMapping("/api/weekly-demo")
public class WeeklyDemoController {

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/create-weekly-data")
    @PreAuthorize("hasRole('DIRECTOR')")
    public ResponseEntity<String> createWeeklyData() {
        List<User> workers = userRepository.findByRole(com.construction.app.enums.UserRole.WORKER);
        
        if (workers.isEmpty()) {
            return ResponseEntity.ok("No workers found!");
        }

        String[][] incomeData = {
            {"Project Payment", "Client A", "Construction project milestone"},
            {"Material Sales", "Customer B", "Building materials sale"},
            {"Service Fee", "Client C", "Consulting services"},
            {"Equipment Rental", "Company D", "Heavy equipment rental"},
            {"Contract Work", "Client E", "Contract completion payment"}
        };

        String[][] spendingData = {
            {"Materials Purchase", "Supplier A", "Raw materials for construction"},
            {"Fuel Costs", "Gas Station", "Vehicle fuel expenses"},
            {"Equipment Maintenance", "Repair Shop", "Machinery maintenance"},
            {"Travel Expenses", "Travel Co", "Business travel costs"},
            {"Repair Services", "Repair Shop", "Equipment maintenance"}
        };

        Random random = new Random();
        int transactionsCreated = 0;
        
        // Create transactions for the past 7 days
        for (int dayOffset = 6; dayOffset >= 0; dayOffset--) {
            LocalDateTime baseTime = LocalDateTime.now().minusDays(dayOffset);
            
            // Create 2-4 income transactions per day
            int incomeCount = 2 + random.nextInt(3);
            for (int i = 0; i < incomeCount; i++) {
                String[] data = incomeData[random.nextInt(incomeData.length)];
                // Spread transactions across different hours (8 AM to 6 PM)
                int hour = 8 + random.nextInt(11); // 8 AM to 6 PM
                int minute = random.nextInt(60);
                LocalDateTime transactionTime = baseTime.withHour(hour).withMinute(minute);
                createTransaction(workers, data, TransactionType.INCOME, transactionTime, random);
                transactionsCreated++;
            }

            // Create 1-3 spending transactions per day
            int spendingCount = 1 + random.nextInt(3);
            for (int i = 0; i < spendingCount; i++) {
                String[] data = spendingData[random.nextInt(spendingData.length)];
                // Spread transactions across different hours (8 AM to 6 PM)
                int hour = 8 + random.nextInt(11); // 8 AM to 6 PM
                int minute = random.nextInt(60);
                LocalDateTime transactionTime = baseTime.withHour(hour).withMinute(minute);
                createTransaction(workers, data, TransactionType.SPENDING, transactionTime, random);
                transactionsCreated++;
            }
        }
        
        return ResponseEntity.ok("Created " + transactionsCreated + " transactions across the past 7 days!");
    }

    private void createTransaction(List<User> workers, String[] data, TransactionType type, LocalDateTime transactionTime, Random random) {
        User worker = workers.get(random.nextInt(workers.size()));
        
        Transaction transaction = new Transaction();
        transaction.setWorker(worker);
        transaction.setType(type);
        transaction.setStatus(TransactionStatus.ACCEPTED); // Demo data is pre-approved
        transaction.setAmount(new BigDecimal(100 + random.nextInt(2000) + random.nextDouble()));
        transaction.setCurrency("UZS");
        transaction.setProduct(data[0]);
        transaction.setSource(data[1]);
        transaction.setDescription(data[2]);
        transaction.setWeightKg(new BigDecimal(5 + random.nextInt(200)));
        transaction.setCreatedAt(transactionTime);
        
        // Set assigned manager
        transaction.setManager(worker.getAssignedManager());
        
        transactionRepository.save(transaction);
    }
}
