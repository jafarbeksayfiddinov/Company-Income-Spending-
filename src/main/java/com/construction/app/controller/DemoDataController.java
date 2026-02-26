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
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;

@RestController
@RequestMapping("/api/demo")
public class DemoDataController {

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/create-transactions")
    @PreAuthorize("hasRole('DIRECTOR')")
    public ResponseEntity<String> createDemoTransactions() {
        List<User> workers = userRepository.findByRole(com.construction.app.enums.UserRole.WORKER);
        Random random = new Random();

        // Sample transaction data
        String[][] incomeData = {
            {"Construction Materials", "Client A", "Payment for building materials"},
            {"Project Milestone", "Client B", "First milestone payment"},
            {"Equipment Rental", "Client C", "Monthly equipment rental"},
            {"Labor Services", "Client D", "Weekly labor payment"},
            {"Consulting Fee", "Client E", "Project consulting services"},
            {"Design Services", "Client F", "Architectural design work"},
            {"Installation", "Client G", "System installation payment"},
            {"Maintenance Contract", "Client H", "Annual maintenance fee"},
            {"Training Services", "Client I", "Staff training program"},
            {"Supply Delivery", "Client J", "Material supply contract"}
        };

        String[][] spendingData = {
            {"Office Supplies", "Office Depot", "Monthly office supplies"},
            {"Fuel Costs", "Gas Station", "Weekly fuel for vehicles"},
            {"Equipment Rental", "Rental Co", "Heavy equipment rental"},
            {"Materials Purchase", "Supplier A", "Construction materials"},
            {"Utility Bills", "Utility Co", "Monthly utilities"},
            {"Insurance Premium", "Insurance Co", "Business insurance"},
            {"Software License", "Tech Vendor", "Annual software license"},
            {"Marketing Expenses", "Ad Agency", "Marketing campaign"},
            {"Travel Expenses", "Travel Co", "Business travel costs"},
            {"Repair Services", "Repair Shop", "Equipment maintenance"}
        };

        // Create transactions for the past few days with better time distribution
        int transactionsCreated = 0;
        for (int dayOffset = 2; dayOffset >= 0; dayOffset--) {
            LocalDateTime baseTime = LocalDateTime.now().minusDays(dayOffset);
            
            // Create 3-5 income transactions per day
            int incomeCount = 3 + random.nextInt(3);
            for (int i = 0; i < incomeCount; i++) {
                String[] data = incomeData[random.nextInt(incomeData.length)];
                // Spread transactions across different hours (8 AM to 8 PM)
                int hour = 8 + random.nextInt(13); // 8 AM to 8 PM
                int minute = random.nextInt(60);
                LocalDateTime transactionTime = baseTime.withHour(hour).withMinute(minute);
                createTransaction(workers, data, TransactionType.INCOME, transactionTime, random);
                transactionsCreated++;
            }

            // Create 2-4 spending transactions per day
            int spendingCount = 2 + random.nextInt(3);
            for (int i = 0; i < spendingCount; i++) {
                String[] data = spendingData[random.nextInt(spendingData.length)];
                // Spread transactions across different hours (8 AM to 8 PM)
                int hour = 8 + random.nextInt(13); // 8 AM to 8 PM
                int minute = random.nextInt(60);
                LocalDateTime transactionTime = baseTime.withHour(hour).withMinute(minute);
                createTransaction(workers, data, TransactionType.SPENDING, transactionTime, random);
                transactionsCreated++;
            }
        }

        return ResponseEntity.ok("Demo transactions created successfully! Created " + transactionsCreated + " transactions for " + workers.size() + " workers.");
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

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getDataStatus() {
        Map<String, Object> status = new HashMap<>();
        status.put("users", userRepository.count());
        status.put("transactions", transactionRepository.count());
        status.put("workers", userRepository.findByRole(com.construction.app.enums.UserRole.WORKER).size());
        status.put("managers", userRepository.findByRole(com.construction.app.enums.UserRole.MANAGER).size());
        status.put("directors", userRepository.findByRole(com.construction.app.enums.UserRole.DIRECTOR).size());
        status.put("needsData", transactionRepository.count() < 50);
        
        return ResponseEntity.ok(status);
    }

    @PostMapping("/create-comprehensive-data")
    @PreAuthorize("hasRole('DIRECTOR')")
    public ResponseEntity<String> createComprehensiveData() {
        List<User> workers = userRepository.findByRole(com.construction.app.enums.UserRole.WORKER);
        Random random = new Random();
        LocalDateTime now = LocalDateTime.now();
        int transactionsCreated = 0;

        // Create transactions for the past 30 days
        for (int daysAgo = 30; daysAgo >= 0; daysAgo--) {
            LocalDateTime dayStart = now.minusDays(daysAgo).withHour(8).withMinute(0);
            
            // Create 5-15 transactions per day
            int dailyTransactions = 5 + random.nextInt(11);
            
            for (int i = 0; i < dailyTransactions; i++) {
                User worker = workers.get(random.nextInt(workers.size()));
                User manager = worker.getAssignedManager();
                
                // Random time during work hours
                int hour = 8 + random.nextInt(10);
                int minute = random.nextInt(60);
                LocalDateTime transactionTime = dayStart.withHour(hour).withMinute(minute);
                
                Transaction transaction = createRandomTransaction(worker, manager, transactionTime, random);
                transactionRepository.save(transaction);
                transactionsCreated++;
            }
        }

        // Create pending transactions
        for (int i = 0; i < 10; i++) {
            User worker = workers.get(random.nextInt(workers.size()));
            User manager = worker.getAssignedManager();
            Transaction pendingTransaction = createPendingTransaction(worker, manager, random);
            transactionRepository.save(pendingTransaction);
            transactionsCreated++;
        }

        // Create rejected transactions
        for (int i = 0; i < 5; i++) {
            User worker = workers.get(random.nextInt(workers.size()));
            User manager = worker.getAssignedManager();
            Transaction rejectedTransaction = createRejectedTransaction(worker, manager, random);
            transactionRepository.save(rejectedTransaction);
            transactionsCreated++;
        }

        return ResponseEntity.ok("Comprehensive demo data created! Total transactions: " + transactionsCreated);
    }

    private Transaction createRandomTransaction(User worker, User manager, LocalDateTime createdAt, Random random) {
        String[][] incomeProducts = {
            {"Cement Delivery", "Client A", "Construction materials"},
            {"Steel Beams", "Client B", "Structural steel"},
            {"Sand", "Client C", "River sand for concrete"},
            {"Gravel", "Client D", "Crushed stone"},
            {"Bricks", "Client E", "Red bricks for walls"}
        };

        String[][] spendingProducts = {
            {"Fuel", "Gas Station", "Diesel for machinery"},
            {"Equipment Rental", "Rental Co", "Heavy equipment"},
            {"Tools", "Hardware Store", "Power tools"},
            {"Safety Equipment", "Safety Supplier", "Safety gear"},
            {"Office Supplies", "Office Depot", "Stationery"}
        };

        String[][] selectedData = random.nextBoolean() ? incomeProducts : spendingProducts;
        String[] data = selectedData[random.nextInt(selectedData.length)];
        TransactionType type = random.nextBoolean() ? TransactionType.INCOME : TransactionType.SPENDING;

        Transaction transaction = new Transaction();
        transaction.setWorker(worker);
        transaction.setManager(manager);
        transaction.setType(type);
        transaction.setStatus(TransactionStatus.ACCEPTED);
        transaction.setAmount(new BigDecimal(100000 + random.nextInt(5000000) + random.nextDouble()));
        transaction.setCurrency("UZS");
        transaction.setProduct(data[0]);
        transaction.setSource(data[1]);
        transaction.setDescription(data[2]);
        transaction.setWeightKg(new BigDecimal(100 + random.nextInt(5000)));
        transaction.setCreatedAt(createdAt);

        return transaction;
    }

    private Transaction createPendingTransaction(User worker, User manager, Random random) {
        String[][] pendingProducts = {
            {"Concrete Mix", "Supplier A", "Ready mix concrete"},
            {"Rebar", "Supplier B", "Steel reinforcement"},
            {"Plywood", "Supplier C", "Plywood sheets"}
        };

        String[] data = pendingProducts[random.nextInt(pendingProducts.length)];

        Transaction transaction = new Transaction();
        transaction.setWorker(worker);
        transaction.setManager(manager);
        transaction.setType(random.nextBoolean() ? TransactionType.INCOME : TransactionType.SPENDING);
        transaction.setStatus(TransactionStatus.PENDING);
        transaction.setAmount(new BigDecimal(200000 + random.nextInt(3000000) + random.nextDouble()));
        transaction.setCurrency("UZS");
        transaction.setProduct(data[0]);
        transaction.setSource(data[1]);
        transaction.setDescription(data[2]);
        transaction.setWeightKg(new BigDecimal(200 + random.nextInt(3000)));
        transaction.setCreatedAt(LocalDateTime.now().minusHours(random.nextInt(24)));

        return transaction;
    }

    private Transaction createRejectedTransaction(User worker, User manager, Random random) {
        String[][] rejectedProducts = {
            {"Used Materials", "Client X", "Returned materials"},
            {"Damaged Goods", "Supplier Y", "Damaged delivery"},
            {"Wrong Order", "Client Z", "Incorrect specification"}
        };

        String[] data = rejectedProducts[random.nextInt(rejectedProducts.length)];

        Transaction transaction = new Transaction();
        transaction.setWorker(worker);
        transaction.setManager(manager);
        transaction.setType(random.nextBoolean() ? TransactionType.INCOME : TransactionType.SPENDING);
        transaction.setStatus(TransactionStatus.REJECTED);
        transaction.setAmount(new BigDecimal(50000 + random.nextInt(1000000) + random.nextDouble()));
        transaction.setCurrency("UZS");
        transaction.setProduct(data[0]);
        transaction.setSource(data[1]);
        transaction.setDescription(data[2]);
        transaction.setWeightKg(new BigDecimal(50 + random.nextInt(1000)));
        transaction.setCreatedAt(LocalDateTime.now().minusDays(random.nextInt(7)));

        return transaction;
    }
}
