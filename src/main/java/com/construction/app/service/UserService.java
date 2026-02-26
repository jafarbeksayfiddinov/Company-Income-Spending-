package com.construction.app.service;

import com.construction.app.dto.UserResponse;
import com.construction.app.entity.User;
import com.construction.app.enums.UserRole;
import com.construction.app.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class UserService {
    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public List<UserResponse> getAllUsersAsDTO() {
        return userRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<User> getUsersByRole(UserRole role) {
        return userRepository.findByRole(role);
    }

    public List<UserResponse> getUsersByRoleAsDTO(UserRole role) {
        return userRepository.findByRole(role).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public UserResponse convertToDTO(User user) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
        Long managerId = user.getAssignedManager() != null ? user.getAssignedManager().getId() : null;
        String managerName = user.getAssignedManager() != null ? user.getAssignedManager().getFullName() : null;
        
        return new UserResponse(
                user.getId(),
                user.getUsername(),
                user.getFullName(),
                user.getRole().toString(),
                user.getActive(),
                user.getCreatedAt().format(formatter),
                user.getUpdatedAt().format(formatter),
                managerId,
                managerName
        );
    }

    public Optional<User> getUserById(Long id) {
        return userRepository.findById(id);
    }

    public User createUser(String username, String password, String fullName, UserRole role) {
        // Check if user already exists
        Optional<User> existing = userRepository.findByUsername(username);
        if (existing.isPresent()) {
            throw new RuntimeException("Username already exists: " + username);
        }

        User user = new User(username, passwordEncoder.encode(password), fullName, role);
        return userRepository.save(user);
    }

    public User updateUser(Long id, String fullName, String password) {
        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isEmpty()) {
            throw new RuntimeException("User not found with id: " + id);
        }

        User user = userOpt.get();
        user.setFullName(fullName);
        if (password != null && !password.isEmpty()) {
            user.setPassword(passwordEncoder.encode(password));
        }
        return userRepository.save(user);
    }

    public void deleteUser(Long id) {
        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isEmpty()) {
            throw new RuntimeException("User not found with id: " + id);
        }

        User user = userOpt.get();
        // Soft delete by marking inactive
        user.setActive(false);
        userRepository.save(user);
    }

    public User assignManagerToWorker(Long workerId, Long managerId) {
        Optional<User> workerOpt = userRepository.findById(workerId);
        if (workerOpt.isEmpty()) {
            throw new RuntimeException("Worker not found with id: " + workerId);
        }

        Optional<User> managerOpt = userRepository.findById(managerId);
        if (managerOpt.isEmpty()) {
            throw new RuntimeException("Manager not found with id: " + managerId);
        }

        User worker = workerOpt.get();
        User manager = managerOpt.get();

        if (worker.getRole() != UserRole.WORKER) {
            throw new RuntimeException("User is not a worker");
        }

        if (manager.getRole() != UserRole.MANAGER) {
            throw new RuntimeException("User is not a manager");
        }

        worker.setAssignedManager(manager);
        return userRepository.save(worker);
    }

    public User updateUserManager(Long userId, Long managerId) {
        Optional<User> userOptional = userRepository.findById(userId);
        if (userOptional.isEmpty()) {
            throw new RuntimeException("User not found with id: " + userId);
        }

        User user = userOptional.get();
        
        if (managerId != null) {
            Optional<User> managerOptional = userRepository.findById(managerId);
            if (managerOptional.isEmpty()) {
                throw new RuntimeException("Manager not found with id: " + managerId);
            }
            User manager = managerOptional.get();
            user.setAssignedManager(manager);
        } else {
            user.setAssignedManager(null);
        }

        return userRepository.save(user);
    }
}
