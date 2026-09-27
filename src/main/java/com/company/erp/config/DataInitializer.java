package com.company.erp.config;

import com.company.erp.modules.users.entity.User;
import com.company.erp.modules.users.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JdbcTemplate jdbcTemplate;

    public DataInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder, JdbcTemplate jdbcTemplate) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(String... args) {
        String adminEmail = "admin@company.com";
        String rawPassword = "Password123!";
        UUID defaultOrgId = UUID.fromString("11111111-2222-3333-4444-555555555555");

        try {
            // 1. Ensure organizations table exists even when Flyway is disabled in dev/in-memory mode
            jdbcTemplate.execute(
                    "CREATE TABLE IF NOT EXISTS organizations (" +
                    "id UUID PRIMARY KEY, " +
                    "name VARCHAR(255) NOT NULL, " +
                    "code VARCHAR(50) NOT NULL UNIQUE, " +
                    "is_active BOOLEAN NOT NULL DEFAULT TRUE, " +
                    "created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP, " +
                    "updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP" +
                    ")"
            );

            // 2. Seed default Organization if not present
            Integer orgCount = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM organizations WHERE id = ?", Integer.class, defaultOrgId
            );
            if (orgCount == null || orgCount == 0) {
                jdbcTemplate.update(
                        "INSERT INTO organizations (id, name, code, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)",
                        defaultOrgId, "Default Tenant", "DEFAULT_TENANT", true
                );
                log.info("Seeded default organization: {}", defaultOrgId);
            }

            // 3. Seed or sync Admin User
            userRepository.findByEmail(adminEmail).ifPresentOrElse(
                    existingUser -> {
                        existingUser.setPasswordHash(passwordEncoder.encode(rawPassword));
                        existingUser.setActive(true);
                        userRepository.save(existingUser);
                        log.info("Reset default admin user password: email='{}', password='{}'", adminEmail, rawPassword);
                    },
                    () -> {
                        User admin = new User();
                        admin.setEmail(adminEmail);
                        admin.setPasswordHash(passwordEncoder.encode(rawPassword));
                        admin.setFirstName("Admin");
                        admin.setLastName("User");
                        admin.setActive(true);
                        admin.setOrganizationId(defaultOrgId);

                        userRepository.save(admin);
                        log.info("Seeded default admin user: email='{}', password='{}'", adminEmail, rawPassword);
                    }
            );
        } catch (Exception e) {
            log.error("DataInitializer failed to seed default data", e);
        }
    }
}
