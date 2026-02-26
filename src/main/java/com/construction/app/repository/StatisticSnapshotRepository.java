package com.construction.app.repository;

import com.construction.app.entity.StatisticSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface StatisticSnapshotRepository extends JpaRepository<StatisticSnapshot, Long> {
    List<StatisticSnapshot> findBySnapshotDateBetweenOrderBySnapshotDateAsc(LocalDate startDate, LocalDate endDate);

    @Query("SELECT s FROM StatisticSnapshot s ORDER BY s.snapshotDate DESC LIMIT 1")
    Optional<StatisticSnapshot> findLatest();

    Optional<StatisticSnapshot> findBySnapshotDate(LocalDate date);
}
