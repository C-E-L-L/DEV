package com.cell.platform.config;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.embedded.EmbeddedDatabase;
import org.springframework.jdbc.datasource.embedded.EmbeddedDatabaseBuilder;
import org.springframework.jdbc.datasource.embedded.EmbeddedDatabaseType;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

class LocalTestPasswordRunnerTest {
    private EmbeddedDatabase database;
    private JdbcTemplate jdbc;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
    private final String nextPassword = "new-local-test-password";

    @BeforeEach
    void setUp() {
        database = new EmbeddedDatabaseBuilder().generateUniqueName(true)
                .setType(EmbeddedDatabaseType.H2).build();
        jdbc = new JdbcTemplate(database);
        jdbc.execute("CREATE TABLE users (id INT PRIMARY KEY, username VARCHAR UNIQUE, "
                + "role VARCHAR, password VARCHAR, name VARCHAR, credential_version BIGINT DEFAULT 0 NOT NULL)");
    }

    @AfterEach
    void tearDown() {
        database.shutdown();
    }

    @Test
    void updatesOnlyExistingLocalTestAccountsAndPreservesTheirIdentity() {
        String oldHash = encoder.encode("previous-local-password");
        addUser(1, "local-admin", "ADMIN", oldHash);
        addUser(2, "local-professor", "EXPERT", oldHash);
        addUser(3, "local-student", "STUDENT", oldHash);
        addUser(4, "another-student", "STUDENT", oldHash);

        new LocalTestPasswordRunner(jdbc, encoder, nextPassword).run();

        for (int id = 1; id <= 3; id++) {
            assertThat(encoder.matches(nextPassword, hash(id))).isTrue();
            assertThat(jdbc.queryForObject("SELECT credential_version FROM users WHERE id = ?", Long.class, id)).isEqualTo(1L);
            assertThat(jdbc.queryForObject("SELECT name FROM users WHERE id = ?", String.class, id))
                    .isEqualTo("Keep name " + id);
        }
        assertThat(hash(4)).isEqualTo(oldHash);
        assertThat(jdbc.queryForObject("SELECT credential_version FROM users WHERE id = 4", Long.class)).isZero();
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM users", Integer.class)).isEqualTo(4);
    }

    @Test
    void preservesMatchingHashAndSkipsAccountsWithAnotherRole() {
        String hash = encoder.encode(nextPassword);
        String otherHash = encoder.encode("keep-this-other-role-password");
        addUser(1, "local-admin", "ADMIN", hash);
        addUser(2, "local-student", "EXPERT", otherHash);

        new LocalTestPasswordRunner(jdbc, encoder, nextPassword).run();

        assertThat(hash(1)).isEqualTo(hash);
        assertThat(hash(2)).isEqualTo(otherHash);
        assertThat(jdbc.queryForObject("SELECT SUM(credential_version) FROM users", Long.class)).isZero();
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM users", Integer.class)).isEqualTo(2);
    }

    @Test
    void rejectsBlankPassword() {
        assertThatThrownBy(() -> new LocalTestPasswordRunner(jdbc, encoder, " ").run())
                .isInstanceOf(IllegalStateException.class);
    }

    private void addUser(int id, String username, String role, String hash) {
        jdbc.update("INSERT INTO users (id,username,role,password,name) VALUES (?, ?, ?, ?, ?)", id, username, role, hash, "Keep name " + id);
    }

    private String hash(int id) {
        return jdbc.queryForObject("SELECT password FROM users WHERE id = ?", String.class, id);
    }
}
