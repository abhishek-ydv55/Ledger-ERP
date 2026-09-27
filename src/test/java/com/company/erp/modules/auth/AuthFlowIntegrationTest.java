package com.company.erp.modules.auth;

import com.company.erp.common.domain.TenantScopedEntity;
import com.company.erp.common.tenant.TenantContext;
import com.company.erp.modules.auth.dto.AuthResponse;
import com.company.erp.modules.auth.dto.LoginRequest;
import com.company.erp.modules.auth.dto.LogoutRequest;
import com.company.erp.modules.auth.dto.RefreshTokenRequest;
import com.company.erp.modules.users.entity.User;
import com.company.erp.modules.users.repository.UserRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityManager;
import org.hibernate.Session;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@AutoConfigureMockMvc
public class AuthFlowIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private EntityManager entityManager;

    private final UUID tenantId = UUID.fromString("11111111-2222-3333-4444-555555555555");
    private final String userEmail = "admin@company.com";
    private final String rawPassword = "Password123!";

    @BeforeEach
    void setUp() {
        jdbcTemplate.execute("DELETE FROM refresh_tokens");
        jdbcTemplate.execute("DELETE FROM party_contacts");
        jdbcTemplate.execute("DELETE FROM party_addresses");
        jdbcTemplate.execute("DELETE FROM party_roles");
        jdbcTemplate.execute("DELETE FROM parties");
        jdbcTemplate.execute("DELETE FROM items");
        jdbcTemplate.execute("DELETE FROM item_categories");
        jdbcTemplate.execute("DELETE FROM units");
        jdbcTemplate.execute("DELETE FROM tax_rates");
        jdbcTemplate.execute("DELETE FROM user_roles");
        jdbcTemplate.execute("DELETE FROM role_permissions");
        jdbcTemplate.execute("DELETE FROM users");
        jdbcTemplate.execute("DELETE FROM roles");
        jdbcTemplate.execute("DELETE FROM permissions");
        jdbcTemplate.execute("DELETE FROM organizations");

        jdbcTemplate.update(
                "INSERT INTO organizations (id, name, code, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)",
                tenantId, "Test Org", "TEST_ORG", true
        );

        TenantContext.setTenantId(tenantId);
        try {
            Session session = entityManager.unwrap(Session.class);
            session.enableFilter(TenantScopedEntity.TENANT_FILTER_NAME)
                    .setParameter(TenantScopedEntity.TENANT_PARAM_NAME, tenantId);
        } catch (Exception ignored) {
        }

        User user = new User();
        user.setEmail(userEmail);
        user.setPasswordHash(passwordEncoder.encode(rawPassword));
        user.setFirstName("Admin");
        user.setLastName("User");
        user.setActive(true);
        user.setOrganizationId(tenantId);

        userRepository.save(user);
        TenantContext.clear();
    }

    @Test
    @DisplayName("Full Authentication Lifecycle: Login -> Protected API -> Refresh Token -> Logout -> Revoked Token Rejection")
    void fullAuthLifecycleTest() throws Exception {
        // =========================================================================
        // Step 1: Login
        // =========================================================================
        LoginRequest loginRequest = new LoginRequest(userEmail, rawPassword);

        MvcResult loginResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.message", is("Login successful")))
                .andExpect(jsonPath("$.data.accessToken").exists())
                .andExpect(jsonPath("$.data.refreshToken").exists())
                .andReturn();

        String loginBody = loginResult.getResponse().getContentAsString();
        Map<String, Object> loginResponseMap = objectMapper.readValue(loginBody, new TypeReference<>() {});
        @SuppressWarnings("unchecked")
        Map<String, Object> data = (Map<String, Object>) loginResponseMap.get("data");

        String accessToken = (String) data.get("accessToken");
        String refreshToken = (String) data.get("refreshToken");

        assertThat(accessToken).isNotBlank();
        assertThat(refreshToken).isNotBlank();

        // =========================================================================
        // Step 2: Access Protected Endpoint with Access Token
        // =========================================================================
        mockMvc.perform(get("/api/v1/items")
                        .header("Authorization", "Bearer " + accessToken)
                        .header("X-Tenant-ID", tenantId.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));

        // =========================================================================
        // Step 3: Refresh Token
        // =========================================================================
        RefreshTokenRequest refreshRequest = new RefreshTokenRequest(refreshToken);

        MvcResult refreshResult = mockMvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(refreshRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.message", is("Token refreshed successfully")))
                .andExpect(jsonPath("$.data.accessToken").exists())
                .andExpect(jsonPath("$.data.refreshToken").exists())
                .andReturn();

        String refreshBody = refreshResult.getResponse().getContentAsString();
        Map<String, Object> refreshResponseMap = objectMapper.readValue(refreshBody, new TypeReference<>() {});
        @SuppressWarnings("unchecked")
        Map<String, Object> refreshData = (Map<String, Object>) refreshResponseMap.get("data");

        String newAccessToken = (String) refreshData.get("accessToken");
        String newRefreshToken = (String) refreshData.get("refreshToken");

        assertThat(newAccessToken).isNotBlank();
        assertThat(newRefreshToken).isNotBlank();

        // =========================================================================
        // Step 4: Access Protected Endpoint with New Access Token
        // =========================================================================
        mockMvc.perform(get("/api/v1/items")
                        .header("Authorization", "Bearer " + newAccessToken)
                        .header("X-Tenant-ID", tenantId.toString()))
                .andExpect(status().isOk());

        // =========================================================================
        // Step 5: Logout
        // =========================================================================
        LogoutRequest logoutRequest = new LogoutRequest(newRefreshToken);

        mockMvc.perform(post("/api/v1/auth/logout")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(logoutRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.message", is("Logout successful")));

        // =========================================================================
        // Step 6: Verify Revoked Refresh Token cannot be used again
        // =========================================================================
        RefreshTokenRequest invalidRefreshRequest = new RefreshTokenRequest(newRefreshToken);

        mockMvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRefreshRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", is("Refresh token has been revoked or expired")));
    }
}
