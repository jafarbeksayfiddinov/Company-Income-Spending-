package com.construction.app.dto;

public class UserResponse {
    private Long id;
    private String username;
    private String fullName;
    private String role;
    private Boolean active;
    private String createdAt;
    private String updatedAt;
    private Long assignedManagerId;
    private String assignedManagerName;

    public UserResponse() {
    }

    public UserResponse(Long id, String username, String fullName, String role, Boolean active,
                       String createdAt, String updatedAt, Long assignedManagerId, String assignedManagerName) {
        this.id = id;
        this.username = username;
        this.fullName = fullName;
        this.role = role;
        this.active = active;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.assignedManagerId = assignedManagerId;
        this.assignedManagerName = assignedManagerName;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public Boolean getActive() {
        return active;
    }

    public void setActive(Boolean active) {
        this.active = active;
    }

    public String getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }

    public String getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(String updatedAt) {
        this.updatedAt = updatedAt;
    }

    public Long getAssignedManagerId() {
        return assignedManagerId;
    }

    public void setAssignedManagerId(Long assignedManagerId) {
        this.assignedManagerId = assignedManagerId;
    }

    public String getAssignedManagerName() {
        return assignedManagerName;
    }

    public void setAssignedManagerName(String assignedManagerName) {
        this.assignedManagerName = assignedManagerName;
    }
}
