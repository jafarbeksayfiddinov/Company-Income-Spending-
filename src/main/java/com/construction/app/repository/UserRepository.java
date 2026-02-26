package com.construction.app.repository;

import com.construction.app.entity.User;
import com.construction.app.enums.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.List;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    List<User> findByRole(UserRole role);
    List<User> findByAssignedManagerId(Long managerId);
    Optional<User> findByIdAndActive(Long id, Boolean active);
    
    @EntityGraph(attributePaths = {"assignedManager"})
    @Override
    Optional<User> findById(Long id);
}
