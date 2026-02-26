package com.construction.app.controller;

import com.construction.app.dto.NotificationResponse;
import com.construction.app.repository.UserRepository;
import com.construction.app.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {
    @Autowired
    private NotificationService notificationService;

    @Autowired
    private UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<NotificationResponse>> getNotifications() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();

        Long workerId = userRepository.findByUsername(username)
                .map(u -> u.getId())
                .orElseThrow(() -> new RuntimeException("Authenticated user not found"));

        List<NotificationResponse> notifications = notificationService.getNotifications(workerId);
        return ResponseEntity.ok(notifications);
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Long> getUnreadCount() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();

        Long workerId = userRepository.findByUsername(username)
                .map(u -> u.getId())
                .orElseThrow(() -> new RuntimeException("Authenticated user not found"));

        Long count = notificationService.getUnreadCount(workerId);
        return ResponseEntity.ok(count);
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(@PathVariable Long id) {
        notificationService.markAsRead(id);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/read-all")
    public ResponseEntity<Void> markAllAsRead() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();

        Long workerId = userRepository.findByUsername(username)
                .map(u -> u.getId())
                .orElseThrow(() -> new RuntimeException("Authenticated user not found"));

        notificationService.markAllAsRead(workerId);
        return ResponseEntity.ok().build();
    }
}
