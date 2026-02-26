package com.construction.app.service;

import com.construction.app.dto.StatisticResponse;
import com.construction.app.entity.StatisticSnapshot;
import com.construction.app.entity.Transaction;
import com.construction.app.enums.TransactionStatus;
import com.construction.app.enums.TransactionType;
import com.construction.app.repository.StatisticSnapshotRepository;
import com.construction.app.repository.TransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class StatisticService {
    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private StatisticSnapshotRepository statisticSnapshotRepository;

    public StatisticResponse getCurrentStatistics() {
        List<Transaction> acceptedTransactions = transactionRepository
                .findByStatusOrderByCreatedAtDesc(TransactionStatus.ACCEPTED);

        BigDecimal totalIncome = BigDecimal.ZERO;
        BigDecimal totalSpending = BigDecimal.ZERO;

        for (Transaction transaction : acceptedTransactions) {
            if (transaction.getType() == TransactionType.INCOME) {
                totalIncome = totalIncome.add(transaction.getAmount());
            } else if (transaction.getType() == TransactionType.SPENDING) {
                totalSpending = totalSpending.add(transaction.getAmount());
            }
        }

        BigDecimal netProfit = totalIncome.subtract(totalSpending);

        StatisticResponse response = new StatisticResponse();
        response.setTotalIncome(totalIncome.toString());
        response.setTotalSpending(totalSpending.toString());
        response.setNetProfit(netProfit.toString());
        response.setTransactionCount((long) acceptedTransactions.size());
        response.setAsOfDate(LocalDate.now().toString());

        return response;
    }

    public List<StatisticResponse> getStatisticHistory(int days) {
        LocalDate endDate = LocalDate.now();
        LocalDate startDate = endDate.minusDays(days);

        List<StatisticSnapshot> snapshots = statisticSnapshotRepository
                .findBySnapshotDateBetweenOrderBySnapshotDateAsc(startDate, endDate);

        // If no snapshots exist, generate from transactions
        if (snapshots.isEmpty()) {
            return generateHistoricalDataFromTransactions(startDate, endDate);
        }

        return snapshots.stream().map(this::convertSnapshotToResponse).collect(Collectors.toList());
    }

    private List<StatisticResponse> generateHistoricalDataFromTransactions(LocalDate startDate, LocalDate endDate) {
        List<StatisticResponse> historicalData = new ArrayList<>();

        for (LocalDate date = startDate; !date.isAfter(endDate); date = date.plusDays(1)) {
            LocalDateTime startOfDay = date.atStartOfDay();
            LocalDateTime endOfDay = date.atTime(23, 59, 59);

            List<Transaction> dayTransactions = transactionRepository
                    .findByCreatedAtBetweenAndStatusOrderByCreatedAtAsc(startOfDay, endOfDay,
                            TransactionStatus.ACCEPTED);

            BigDecimal totalIncome = BigDecimal.ZERO;
            BigDecimal totalSpending = BigDecimal.ZERO;

            for (Transaction transaction : dayTransactions) {
                if (transaction.getType() == TransactionType.INCOME) {
                    totalIncome = totalIncome.add(transaction.getAmount());
                } else if (transaction.getType() == TransactionType.SPENDING) {
                    totalSpending = totalSpending.add(transaction.getAmount());
                }
            }

            BigDecimal netProfit = totalIncome.subtract(totalSpending);

            StatisticResponse response = new StatisticResponse();
            response.setTotalIncome(totalIncome.toString());
            response.setTotalSpending(totalSpending.toString());
            response.setNetProfit(netProfit.toString());
            response.setTransactionCount((long) dayTransactions.size());
            response.setAsOfDate(date.toString());

            historicalData.add(response);
        }

        return historicalData;
    }

    public List<Map<String, Object>> getTodayHourlyGrowth() {
        LocalDateTime startOfPeriod = LocalDateTime.now().minusHours(23); // 24 hours ago
        LocalDateTime now = LocalDateTime.now();

        List<Transaction> periodTransactions = transactionRepository
                .findByCreatedAtBetweenAndStatusOrderByCreatedAtAsc(startOfPeriod, now, TransactionStatus.ACCEPTED);

        Map<Integer, BigDecimal> hourlyIncome = new HashMap<>();
        Map<Integer, BigDecimal> hourlySpending = new HashMap<>();

        // Initialize all hours with zero
        for (int i = 0; i < 24; i++) {
            hourlyIncome.put(i, BigDecimal.ZERO);
            hourlySpending.put(i, BigDecimal.ZERO);
        }

        // Aggregate by hour
        for (Transaction transaction : periodTransactions) {
            int hour = transaction.getCreatedAt().getHour();
            BigDecimal amount = transaction.getAmount();

            if (transaction.getType() == TransactionType.INCOME) {
                hourlyIncome.put(hour, hourlyIncome.get(hour).add(amount));
            } else if (transaction.getType() == TransactionType.SPENDING) {
                hourlySpending.put(hour, hourlySpending.get(hour).add(amount));
            }
        }

        // Convert to list format for frontend
        List<Map<String, Object>> hourlyData = new ArrayList<>();
        DateTimeFormatter hourFormatter = DateTimeFormatter.ofPattern("HH:mm");

        // Find the maximum hour that has transactions
        int maxHourWithTransactions = -1;
        for (int i = 0; i < 24; i++) {
            if (!hourlyIncome.get(i).equals(BigDecimal.ZERO) || !hourlySpending.get(i).equals(BigDecimal.ZERO)) {
                maxHourWithTransactions = i;
            }
        }

        // Show all hours up to the max hour with transactions (or current hour,
        // whichever is higher)
        int maxHour = Math.max(maxHourWithTransactions, now.getHour());
        maxHour = Math.min(maxHour, 23); // Don't go beyond 23

        for (int i = 0; i <= maxHour; i++) {
            Map<String, Object> hourData = new HashMap<>();
            hourData.put("hour", String.format("%02d:00", i));
            hourData.put("income", hourlyIncome.get(i));
            hourData.put("spending", hourlySpending.get(i));
            hourData.put("netProfit", hourlyIncome.get(i).subtract(hourlySpending.get(i)));
            hourlyData.add(hourData);
        }

        return hourlyData;
    }

    @Scheduled(cron = "0 0 0 * * *") // Every day at midnight
    public void createDailySnapshot() {
        LocalDate yesterday = LocalDate.now().minusDays(1);

        // Check if snapshot already exists for yesterday
        if (statisticSnapshotRepository.findBySnapshotDate(yesterday).isPresent()) {
            return; // Already created
        }

        // Calculate only yesterday's transactions (per-day, not cumulative)
        LocalDateTime startOfDay = yesterday.atStartOfDay();
        LocalDateTime endOfDay = yesterday.atTime(23, 59, 59);

        List<Transaction> dayTransactions = transactionRepository
                .findByCreatedAtBetweenAndStatusOrderByCreatedAtAsc(startOfDay, endOfDay, TransactionStatus.ACCEPTED);

        BigDecimal totalIncome = BigDecimal.ZERO;
        BigDecimal totalSpending = BigDecimal.ZERO;

        for (Transaction transaction : dayTransactions) {
            if (transaction.getType() == TransactionType.INCOME) {
                totalIncome = totalIncome.add(transaction.getAmount());
            } else if (transaction.getType() == TransactionType.SPENDING) {
                totalSpending = totalSpending.add(transaction.getAmount());
            }
        }

        BigDecimal netProfit = totalIncome.subtract(totalSpending);

        StatisticSnapshot snapshot = new StatisticSnapshot(
                yesterday,
                totalIncome,
                totalSpending,
                netProfit,
                dayTransactions.size());

        statisticSnapshotRepository.save(snapshot);
    }

    private StatisticResponse convertSnapshotToResponse(StatisticSnapshot snapshot) {
        StatisticResponse response = new StatisticResponse();
        response.setTotalIncome(snapshot.getTotalIncome().toString());
        response.setTotalSpending(snapshot.getTotalSpending().toString());
        response.setNetProfit(snapshot.getNetProfit().toString());
        response.setTransactionCount((long) snapshot.getTransactionCount());
        response.setAsOfDate(snapshot.getSnapshotDate().toString());
        return response;
    }
}
