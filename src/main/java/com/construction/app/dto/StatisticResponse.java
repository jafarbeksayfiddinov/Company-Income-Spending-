package com.construction.app.dto;

public class StatisticResponse {
    private String totalIncome;
    private String totalSpending;
    private String netProfit;
    private Long transactionCount;
    private String asOfDate;

    public StatisticResponse() {
    }

    public String getTotalIncome() {
        return totalIncome;
    }

    public void setTotalIncome(String totalIncome) {
        this.totalIncome = totalIncome;
    }

    public String getTotalSpending() {
        return totalSpending;
    }

    public void setTotalSpending(String totalSpending) {
        this.totalSpending = totalSpending;
    }

    public String getNetProfit() {
        return netProfit;
    }

    public void setNetProfit(String netProfit) {
        this.netProfit = netProfit;
    }

    public Long getTransactionCount() {
        return transactionCount;
    }

    public void setTransactionCount(Long transactionCount) {
        this.transactionCount = transactionCount;
    }

    public String getAsOfDate() {
        return asOfDate;
    }

    public void setAsOfDate(String asOfDate) {
        this.asOfDate = asOfDate;
    }
}
