package com.construction.app.config;

import com.construction.app.entity.Transaction;
import com.construction.app.entity.User;
import com.construction.app.enums.TransactionStatus;
import com.construction.app.enums.TransactionType;
import com.construction.app.enums.UserRole;
import com.construction.app.repository.TransactionRepository;
import com.construction.app.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Configuration
public class DataInitializer {
    @Autowired
    private PasswordEncoder passwordEncoder;

    @Bean
    @Order(1)
    public CommandLineRunner initializeData(UserRepository userRepository,
                                            TransactionRepository transactionRepository) {
        return args -> {
            if (userRepository.count() == 0) {
                User director = new User();
                director.setUsername("director");
                director.setPassword(passwordEncoder.encode("director123"));
                director.setFullName("John Director");
                director.setRole(UserRole.DIRECTOR);
                director.setActive(true);
                director.setCreatedAt(LocalDateTime.now());
                director.setUpdatedAt(LocalDateTime.now());
                userRepository.save(director);

                User manager = new User();
                manager.setUsername("manager");
                manager.setPassword(passwordEncoder.encode("manager123"));
                manager.setFullName("Mike Manager");
                manager.setRole(UserRole.MANAGER);
                manager.setActive(true);
                manager.setCreatedAt(LocalDateTime.now());
                manager.setUpdatedAt(LocalDateTime.now());
                userRepository.save(manager);

                // Create additional managers
                User manager2 = new User();
                manager2.setUsername("manager2");
                manager2.setPassword(passwordEncoder.encode("manager123"));
                manager2.setFullName("Sarah Manager");
                manager2.setRole(UserRole.MANAGER);
                manager2.setActive(true);
                manager2.setCreatedAt(LocalDateTime.now());
                manager2.setUpdatedAt(LocalDateTime.now());
                userRepository.save(manager2);

                User worker1 = new User();
                worker1.setUsername("worker");
                worker1.setPassword(passwordEncoder.encode("worker123"));
                worker1.setFullName("Alice Worker");
                worker1.setRole(UserRole.WORKER);
                worker1.setActive(true);
                worker1.setAssignedManager(manager);
                worker1.setCreatedAt(LocalDateTime.now());
                worker1.setUpdatedAt(LocalDateTime.now());
                userRepository.save(worker1);

                User worker2 = new User();
                worker2.setUsername("worker2");
                worker2.setPassword(passwordEncoder.encode("worker123"));
                worker2.setFullName("Bob Worker");
                worker2.setRole(UserRole.WORKER);
                worker2.setActive(true);
                worker2.setAssignedManager(manager);
                worker2.setCreatedAt(LocalDateTime.now());
                worker2.setUpdatedAt(LocalDateTime.now());
                userRepository.save(worker2);

                // Create additional workers assigned to different managers
                User worker3 = new User();
                worker3.setUsername("worker3");
                worker3.setPassword(passwordEncoder.encode("worker123"));
                worker3.setFullName("Charlie Worker");
                worker3.setRole(UserRole.WORKER);
                worker3.setActive(true);
                worker3.setAssignedManager(manager2);
                worker3.setCreatedAt(LocalDateTime.now());
                worker3.setUpdatedAt(LocalDateTime.now());
                userRepository.save(worker3);

                User worker4 = new User();
                worker4.setUsername("worker4");
                worker4.setPassword(passwordEncoder.encode("worker123"));
                worker4.setFullName("Diana Worker");
                worker4.setRole(UserRole.WORKER);
                worker4.setActive(true);
                worker4.setAssignedManager(manager2);
                worker4.setCreatedAt(LocalDateTime.now());
                worker4.setUpdatedAt(LocalDateTime.now());
                userRepository.save(worker4);

                // Create one sample pending transaction for testing
                Transaction transaction1 = new Transaction();
                transaction1.setWorker(worker1);
                transaction1.setManager(manager);
                transaction1.setType(TransactionType.INCOME);
                transaction1.setStatus(TransactionStatus.PENDING);
                transaction1.setAmount(new BigDecimal("500.00"));
                transaction1.setCurrency("USD");
                transaction1.setProduct("Gravel");
                transaction1.setSource("Project A");
                transaction1.setDescription("30 tons of gravel delivered");
                transaction1.setWeightKg(new BigDecimal("30000.00"));
                transaction1.setCreatedAt(LocalDateTime.now());
                transactionRepository.save(transaction1);
            }
        };
    }
}
