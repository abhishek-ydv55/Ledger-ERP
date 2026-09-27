package com.company.erp;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class ErpApplicationTests extends BaseIntegrationTest {

    @Test
    @DisplayName("Context loads cleanly with Testcontainers PostgreSQL")
    void contextLoads() {
        // Verifies that Spring context and Flyway migrations initialize cleanly against PostgreSQL Testcontainer
    }
}
