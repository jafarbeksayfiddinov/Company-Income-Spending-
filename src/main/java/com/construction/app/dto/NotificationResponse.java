package com.construction.app.dto;

public class NotificationResponse {
    private Long id;
    private String type;
    private Long transactionId;
    private String message;
    private Boolean isRead;
    private String createdAt;

    public NotificationResponse() {
    }

    public NotificationResponse(Long id, String type, Long transactionId, String message, Boolean isRead, String createdAt) {
        this.id = id;
        this.type = type;
        this.transactionId = transactionId;
        this.message = message;
        this.isRead = isRead;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public Long getTransactionId() {
        return transactionId;
    }

    public void setTransactionId(Long transactionId) {
        this.transactionId = transactionId;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public Boolean getIsRead() {
        return isRead;
    }

    public void setIsRead(Boolean isRead) {
        this.isRead = isRead;
    }

    public String getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }
}
