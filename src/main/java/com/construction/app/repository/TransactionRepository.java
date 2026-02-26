package com.construction.app.repository;

import com.construction.app.entity.Transaction;
import com.construction.app.enums.TransactionStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    List<Transaction> findByWorkerId(Long workerId);

    List<Transaction> findByWorkerIdOrderByCreatedAtDesc(Long workerId);

    List<Transaction> findByManagerIdAndStatus(Long managerId, TransactionStatus status);

    List<Transaction> findByManagerIdOrderByCreatedAtDesc(Long managerId);

    List<Transaction> findByStatusOrderByCreatedAtDesc(TransactionStatus status);

    // Worker history filters
    List<Transaction> findByWorkerIdAndStatusOrderByCreatedAtDesc(Long workerId, TransactionStatus status);

    // Manager history filters - only their assigned workers' transactions
    List<Transaction> findByManagerIdAndStatusOrderByCreatedAtDesc(Long managerId, TransactionStatus status);

    // Today's hourly statistics
    List<Transaction> findByCreatedAtBetweenAndStatusOrderByCreatedAtAsc(LocalDateTime start, LocalDateTime end,
            TransactionStatus status);

    // Paginated queries for Director Dashboard
    Page<Transaction> findByStatusOrderByCreatedAtDesc(TransactionStatus status, Pageable pageable);

    // Director filtering queries
    Page<Transaction> findByStatusAndWorkerUsername(TransactionStatus status, String workerUsername, Pageable pageable);

    Page<Transaction> findByWorkerUsernameOrderByCreatedAtDesc(String workerUsername, Pageable pageable);

    @Query("SELECT t FROM Transaction t WHERE t.worker.username = :workerUsername ORDER BY t.createdAt DESC")
    Page<Transaction> findByWorkerUsernameQuery(@Param("workerUsername") String workerUsername, Pageable pageable);

    @Query("SELECT t FROM Transaction t WHERE t.status = :status AND t.worker.username = :workerUsername ORDER BY t.createdAt DESC")
    Page<Transaction> findByStatusAndWorkerUsernameQuery(@Param("status") TransactionStatus status, @Param("workerUsername") String workerUsername, Pageable pageable);

    Page<Transaction> findAllByOrderByCreatedAtDesc(Pageable pageable);

    // Director summary stats
    long countByStatus(TransactionStatus status);
}
