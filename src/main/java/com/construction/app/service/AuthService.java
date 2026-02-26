package com.construction.app.service;

import com.construction.app.dto.LoginRequest;
import com.construction.app.dto.LoginResponse;
import com.construction.app.entity.User;
import com.construction.app.repository.UserRepository;
import com.construction.app.security.JwtTokenProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class AuthService {
    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public LoginResponse login(LoginRequest loginRequest) {
        Optional<User> userOptional = userRepository.findByUsername(loginRequest.getUsername());

        if (userOptional.isEmpty()) {
            throw new RuntimeException("User not found");
        }

        User user = userOptional.get();

        if (!user.getActive()) {
            throw new RuntimeException("User is not active");
        }

        if (!passwordEncoder.matches(loginRequest.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid password");
        }

        String token = jwtTokenProvider.generateToken(user.getUsername(), user.getRole().toString());

        return new LoginResponse(token, user.getId(), user.getUsername(), user.getRole().toString(),
                user.getFullName());
    }
}
