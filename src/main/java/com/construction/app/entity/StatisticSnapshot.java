package com.construction.app.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "statistic_snapshots", indexes = {
    @Index(name = "idx_snapshot_date", columnList = "snapshot_date")
})
public class StatisticSnapshot {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private LocalDate snapshotDate;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal totalIncome;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal totalSpending;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal netProfit;

    @Column(nullable = false)
    private Integer transactionCount;

    public StatisticSnapshot() {
    }

    public StatisticSnapshot(LocalDate snapshotDate, BigDecimal totalIncome, BigDecimal totalSpending, BigDecimal netProfit, Integer transactionCount) {
        this.snapshotDate = snapshotDate;
        this.totalIncome = totalIncome;
        this.totalSpending = totalSpending;
        this.netProfit = netProfit;
        this.transactionCount = transactionCount;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public LocalDate getSnapshotDate() {
        return snapshotDate;
    }

    public void setSnapshotDate(LocalDate snapshotDate) {
        this.snapshotDate = snapshotDate;
    }

    public BigDecimal getTotalIncome() {
        return totalIncome;
    }

    public void setTotalIncome(BigDecimal totalIncome) {
        this.totalIncome = totalIncome;
    }

    public BigDecimal getTotalSpending() {
        return totalSpending;
    }

    public void setTotalSpending(BigDecimal totalSpending) {
        this.totalSpending = totalSpending;
    }

    public BigDecimal getNetProfit() {
        return netProfit;
    }

    public void setNetProfit(BigDecimal netProfit) {
        this.netProfit = netProfit;
    }

    public Integer getTransactionCount() {
        return transactionCount;
    }

    public void setTransactionCount(Integer transactionCount) {
        this.transactionCount = transactionCount;
    }
}
