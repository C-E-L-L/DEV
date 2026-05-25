package com.cell.platform.config;

import com.cell.platform.domain.user.Role;
import com.cell.platform.domain.user.User;
import com.cell.platform.domain.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class AdminSeedRunner implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${admin.username:}")
    private String adminUsername;

    @Value("${admin.password:}")
    private String adminPassword;

    @Override
    public void run(String... args) {
        if (adminUsername == null || adminUsername.isBlank()
                || adminPassword == null || adminPassword.isBlank()) {
            log.warn("Admin seed skipped: admin.username or admin.password is empty.");
            return;
        }

        if (userRepository.existsByUsername(adminUsername)) {
            return;
        }

        String hashedPassword = passwordEncoder.encode(adminPassword);
        User admin = User.create(adminUsername, hashedPassword, Role.ADMIN);
        userRepository.save(admin);
        log.info("Admin account seeded: {}", adminUsername);
    }
}
