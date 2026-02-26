package com.construction.app.service;

import com.construction.app.dto.NotificationResponse;
import com.construction.app.entity.Notification;
import com.construction.app.entity.User;
import com.construction.app.repository.NotificationRepository;
import com.construction.app.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class NotificationService {
    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private UserRepository userRepository;

    public void createNotification(Long workerId, String type, Long transactionId, String message) {
        User worker = userRepository.findById(workerId).orElse(null);
        if (worker != null) {
            Notification notification = new Notification(worker, type, transactionId, message);
            notificationRepository.save(notification);
        }
    }

    public List<NotificationResponse> getNotifications(Long workerId) {
        List<Notification> notifications = notificationRepository.findByWorkerIdOrderByCreatedAtDesc(workerId);
        return notifications.stream().map(this::convertToResponse).collect(Collectors.toList());
    }

    public Long getUnreadCount(Long workerId) {
        return notificationRepository.countByWorkerIdAndIsReadFalse(workerId);
    }

    public void markAsRead(Long notificationId) {
        notificationRepository.findById(notificationId).ifPresent(notification -> {
            notification.setIsRead(true);
            notificationRepository.save(notification);
        });
    }

    public void markAllAsRead(Long workerId) {
        List<Notification> notifications = notificationRepository.findByWorkerIdOrderByCreatedAtDesc(workerId);
        notifications.forEach(n -> n.setIsRead(true));
        notificationRepository.saveAll(notifications);
    }

    private NotificationResponse convertToResponse(Notification notification) {
        NotificationResponse response = new NotificationResponse();
        response.setId(notification.getId());
        response.setType(notification.getType());
        response.setTransactionId(notification.getTransactionId());
        response.setMessage(notification.getMessage());
        response.setIsRead(notification.getIsRead());
        response.setCreatedAt(notification.getCreatedAt().toString());
        return response;
    }
}
