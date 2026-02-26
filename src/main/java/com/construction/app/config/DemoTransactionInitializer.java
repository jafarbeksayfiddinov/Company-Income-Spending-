package com.construction.app.config;

import com.construction.app.entity.Transaction;
import com.construction.app.entity.User;
import com.construction.app.enums.TransactionStatus;
import com.construction.app.enums.TransactionType;
import com.construction.app.repository.TransactionRepository;
import com.construction.app.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Random;

@Component
@Order(2) // Run after DataInitializer which is @Order(1) by default
public class DemoTransactionInitializer implements CommandLineRunner {

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private UserRepository userRepository;

    @Override
    public void run(String... args) throws Exception {
        // Only create demo data if no transactions exist
        if (transactionRepository.count() == 0) {
            createDemoTransactions();
        }
    }

    private void createDemoTransactions() {
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

        // Create transactions for the past few days
        for (int dayOffset = 2; dayOffset >= 0; dayOffset--) {
            LocalDateTime baseTime = LocalDateTime.now().minusDays(dayOffset);
            
            // Create 3-5 income transactions per day
            int incomeCount = 3 + random.nextInt(3);
            for (int i = 0; i < incomeCount; i++) {
                String[] data = incomeData[random.nextInt(incomeData.length)];
                createTransaction(workers, data, TransactionType.INCOME, baseTime, random);
            }

            // Create 2-4 spending transactions per day
            int spendingCount = 2 + random.nextInt(3);
            for (int i = 0; i < spendingCount; i++) {
                String[] data = spendingData[random.nextInt(spendingData.length)];
                createTransaction(workers, data, TransactionType.SPENDING, baseTime, random);
            }
        }

        System.out.println("✅ Demo transactions created successfully!");
        System.out.println("   - Workers: " + workers.size());
        System.out.println("   - Total transactions: " + transactionRepository.count());
    }

    private void createTransaction(List<User> workers, String[] data, TransactionType type, LocalDateTime baseTime, Random random) {
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
        
        // Random time within the day
        int hour = random.nextInt(24);
        int minute = random.nextInt(60);
        transaction.setCreatedAt(baseTime.withHour(hour).withMinute(minute));
        
        // Set assigned manager
        transaction.setManager(worker.getAssignedManager());
        
        transactionRepository.save(transaction);
    }
}
