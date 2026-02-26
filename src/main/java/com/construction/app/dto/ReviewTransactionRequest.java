package com.construction.app.dto;

public class ReviewTransactionRequest {
    private String action;
    private String comment;

    public ReviewTransactionRequest() {
    }

    public ReviewTransactionRequest(String action, String comment) {
        this.action = action;
        this.comment = comment;
    }

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }
}
