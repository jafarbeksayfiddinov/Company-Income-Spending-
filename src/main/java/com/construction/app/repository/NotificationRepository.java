package com.construction.app.repository;

import com.construction.app.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByWorkerIdOrderByCreatedAtDesc(Long workerId);
    Long countByWorkerIdAndIsReadFalse(Long workerId);
    List<Notification> findByTransactionId(Long transactionId);
}
