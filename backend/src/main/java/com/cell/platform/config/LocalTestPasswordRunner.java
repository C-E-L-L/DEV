package com.cell.platform.config;

import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/** Keeps only the three local test accounts in sync with settings.json. */
@Component
@Profile("local")
public class LocalTestPasswordRunner implements CommandLineRunner {
    private static final Logger log = LoggerFactory.getLogger(LocalTestPasswordRunner.class);
    private static final Map<String, String> TEST_ACCOUNTS = Map.of(
            "local-admin", "ADMIN",
            "local-professor", "EXPERT",
            "local-student", "STUDENT");

    private final JdbcTemplate jdbc;
    private final PasswordEncoder encoder;
    private final String password;

    public LocalTestPasswordRunner(JdbcTemplate jdbc, PasswordEncoder encoder,
                                  @Value("${admin.password:}") String password) {
        this.jdbc = jdbc;
        this.encoder = encoder;
        this.password = password;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (password == null || password.isBlank()) {
            throw new IllegalStateException("Local test account password must not be empty.");
        }
        int changed = 0;
        for (var account : TEST_ACCOUNTS.entrySet()) {
            var stored = jdbc.query("SELECT password FROM users WHERE username = ? AND role = ?",
                    (rs, rowNum) -> rs.getString(1), account.getKey(), account.getValue());
            if (!stored.isEmpty() && !encoder.matches(password, stored.get(0))) {
                changed += jdbc.update("UPDATE users SET password = ?, credential_version = credential_version + 1 WHERE username = ? AND role = ?",
                        encoder.encode(password), account.getKey(), account.getValue());
            }
        }
        log.info("Local test account passwords synchronized: {} updated", changed);
    }
}
