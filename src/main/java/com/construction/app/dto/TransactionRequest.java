package com.construction.app.dto;

public class TransactionRequest {
    private String type;
    private String amount;
    private String currency;
    private String product;
    private String source;
    private String description;
    private String weightKg;

    public TransactionRequest() {
    }

    public TransactionRequest(String type, String amount, String currency, String product,
                             String source, String description, String weightKg) {
        this.type = type;
        this.amount = amount;
        this.currency = currency;
        this.product = product;
        this.source = source;
        this.description = description;
        this.weightKg = weightKg;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getAmount() {
        return amount;
    }

    public void setAmount(String amount) {
        this.amount = amount;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public String getProduct() {
        return product;
    }

    public void setProduct(String product) {
        this.product = product;
    }

    public String getSource() {
        return source;
    }

    public void setSource(String source) {
        this.source = source;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getWeightKg() {
        return weightKg;
    }

    public void setWeightKg(String weightKg) {
        this.weightKg = weightKg;
    }
}
