package com.construction.app.controller;

import com.construction.app.dto.UserResponse;
import com.construction.app.entity.User;
import com.construction.app.enums.UserRole;
import com.construction.app.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserController {
    @Autowired
    private UserService userService;

    @GetMapping
    public ResponseEntity<List<UserResponse>> getAllUsers(@RequestParam(required = false) String role) {
        List<UserResponse> users;
        
        if (role != null && !role.isEmpty()) {
            try {
                UserRole userRole = UserRole.valueOf(role.toUpperCase());
                users = userService.getUsersByRoleAsDTO(userRole);
            } catch (IllegalArgumentException e) {
                throw new RuntimeException("Invalid role: " + role);
            }
        } else {
            users = userService.getAllUsersAsDTO();
        }
        
        return ResponseEntity.ok(users);
    }

    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        User user = userService.getUserById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(user);
    }

    @PostMapping
    public ResponseEntity<User> createUser(@RequestBody Map<String, String> body) {
        String username = body.get("username");
        String password = body.get("password");
        String fullName = body.get("fullName");
        String role = body.get("role");

        if (username == null || password == null || fullName == null || role == null) {
            throw new RuntimeException("Missing required fields");
        }

        try {
            UserRole userRole = UserRole.valueOf(role.toUpperCase());
            User user = userService.createUser(username, password, fullName, userRole);
            return ResponseEntity.ok(user);
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid role: " + role);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<User> updateUser(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String fullName = body.get("fullName");
        String password = body.get("password");

        if (fullName == null) {
            throw new RuntimeException("fullName is required");
        }

        User user = userService.updateUser(id, fullName, password);
        return ResponseEntity.ok(user);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        Map<String, String> response = new HashMap<>();
        response.put("message", "User deleted successfully");
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{workerId}/assign-manager")
    public ResponseEntity<UserResponse> assignManagerToWorker(
            @PathVariable Long workerId,
            @RequestBody Map<String, Long> body) {
        Long managerId = body.get("managerId");
        if (managerId == null) {
            throw new RuntimeException("managerId is required");
        }

        User worker = userService.assignManagerToWorker(workerId, managerId);
        return ResponseEntity.ok(userService.convertToDTO(worker));
    }

    @PutMapping("/{userId}/update-manager")
    public ResponseEntity<UserResponse> updateUserManager(
            @PathVariable Long userId,
            @RequestBody Map<String, Long> body) {
        Long managerId = body.get("managerId");
        
        User user = userService.updateUserManager(userId, managerId);
        return ResponseEntity.ok(userService.convertToDTO(user));
    }
}
