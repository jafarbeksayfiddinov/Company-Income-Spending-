package com.construction.app.controller;

import com.construction.app.entity.Transaction;
import com.construction.app.entity.User;
import com.construction.app.enums.TransactionStatus;
import com.construction.app.enums.TransactionType;
import com.construction.app.enums.UserRole;
import com.construction.app.repository.TransactionRepository;
import com.construction.app.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Random;

@RestController
@RequestMapping("/api/bulk-demo")
public class BulkDemoSeedController {

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/seed")
    @PreAuthorize("hasRole('DIRECTOR')")
    public ResponseEntity<String> seed(
            @RequestParam(defaultValue = "90") int days,
            @RequestParam(defaultValue = "8") int minPerDay,
            @RequestParam(defaultValue = "16") int maxPerDay
    ) {
        if (days <= 0) {
            return ResponseEntity.badRequest().body("days must be > 0");
        }
        if (minPerDay <= 0 || maxPerDay <= 0 || maxPerDay < minPerDay) {
            return ResponseEntity.badRequest().body("minPerDay/maxPerDay must be > 0 and maxPerDay >= minPerDay");
        }

        List<User> workers = userRepository.findByRole(UserRole.WORKER);
        if (workers.isEmpty()) {
            return ResponseEntity.ok("No workers found!");
        }

        String[][] incomeData = {
                {"Project Payment", "Client A", "Construction project milestone"},
                {"Material Sales", "Customer B", "Building materials sale"},
                {"Service Fee", "Client C", "Consulting services"},
                {"Equipment Rental", "Company D", "Heavy equipment rental"},
                {"Contract Work", "Client E", "Contract completion payment"},
                {"Maintenance", "Client F", "Service and maintenance payment"}
        };

        String[][] spendingData = {
                {"Materials Purchase", "Supplier A", "Raw materials for construction"},
                {"Fuel Costs", "Gas Station", "Vehicle fuel expenses"},
                {"Equipment Maintenance", "Repair Shop", "Machinery maintenance"},
                {"Travel Expenses", "Travel Co", "Business travel costs"},
                {"Site Utilities", "Utility Co", "Temporary site electricity/water"},
                {"Wages", "Payroll", "Worker wages and overtime"}
        };

        Random random = new Random();
        int created = 0;
        LocalDateTime now = LocalDateTime.now();

        for (int dayOffset = days - 1; dayOffset >= 0; dayOffset--) {
            LocalDateTime baseTime = now.minusDays(dayOffset);

            int count = minPerDay + random.nextInt((maxPerDay - minPerDay) + 1);
            for (int i = 0; i < count; i++) {
                TransactionType type = random.nextInt(100) < 55 ? TransactionType.INCOME : TransactionType.SPENDING;
                String[] data = type == TransactionType.INCOME
                        ? incomeData[random.nextInt(incomeData.length)]
                        : spendingData[random.nextInt(spendingData.length)];

                int hour = 8 + random.nextInt(13);
                int minute = random.nextInt(60);
                int second = random.nextInt(60);
                LocalDateTime transactionTime = baseTime.withHour(hour).withMinute(minute).withSecond(second);

                User worker = workers.get(random.nextInt(workers.size()));

                BigDecimal amount = new BigDecimal(250 + random.nextInt(9500) + random.nextDouble());
                if (type == TransactionType.SPENDING && random.nextInt(100) < 20) {
                    amount = amount.add(new BigDecimal(5000 + random.nextInt(15000)));
                }

                Transaction t = new Transaction();
                t.setWorker(worker);
                t.setType(type);
                t.setStatus(TransactionStatus.ACCEPTED);
                t.setAmount(amount);
                t.setCurrency("UZS");
                t.setProduct(data[0]);
                t.setSource(data[1]);
                t.setDescription(data[2]);
                t.setWeightKg(new BigDecimal(5 + random.nextInt(250)));
                t.setCreatedAt(transactionTime);
                t.setManager(worker.getAssignedManager());

                transactionRepository.save(t);
                created++;
            }
        }

        return ResponseEntity.ok("Seeded " + created + " accepted transactions across the past " + days + " days (" + minPerDay + "-" + maxPerDay + "/day)." );
    }
}
