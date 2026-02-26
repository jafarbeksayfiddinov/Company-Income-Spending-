package com.construction.app.controller;

import com.construction.app.entity.Transaction;
import com.construction.app.enums.TransactionStatus;
import com.construction.app.repository.TransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/debug")
public class DebugController {

    @Autowired
    private TransactionRepository transactionRepository;

    @GetMapping("/hourly-debug")
    @PreAuthorize("hasRole('DIRECTOR')")
    public ResponseEntity<Map<String, Object>> debugHourlyData() {
        LocalDateTime startOfDay = LocalDateTime.now().toLocalDate().atStartOfDay();
        LocalDateTime now = LocalDateTime.now();
        
        List<Transaction> todayTransactions = transactionRepository
                .findByCreatedAtBetweenAndStatusOrderByCreatedAtAsc(startOfDay, now, TransactionStatus.ACCEPTED);
        
        Map<String, Object> debug = new HashMap<>();
        debug.put("startOfDay", startOfDay.toString());
        debug.put("now", now.toString());
        debug.put("transactionCount", todayTransactions.size());
        
        Map<String, Object> transactionsByHour = new HashMap<>();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("HH:mm");
        
        for (Transaction transaction : todayTransactions) {
            String hour = transaction.getCreatedAt().format(formatter);
            transactionsByHour.put(hour, Map.of(
                "amount", transaction.getAmount(),
                "type", transaction.getType(),
                "product", transaction.getProduct()
            ));
        }
        
        debug.put("transactionsByHour", transactionsByHour);
        
        return ResponseEntity.ok(debug);
    }
}
