package com.company.erp.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class JwtTokenProviderTest {

    private static final String SECRET = "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970";
    private static final long ACCESS_EXPIRATION = 900000; // 15 mins
    private static final long REFRESH_EXPIRATION = 604800000; // 7 days

    private JwtTokenProvider tokenProvider;

    @BeforeEach
    void setUp() {
        tokenProvider = new JwtTokenProvider(SECRET, ACCESS_EXPIRATION, REFRESH_EXPIRATION);
    }

    @Test
    @DisplayName("Valid token round-trip: Generates token and extracts claims successfully")
    void validTokenRoundTrip() {
        String userId = "user-123";
        UUID organizationId = UUID.randomUUID();
        List<String> permissions = List.of("ITEMS_READ", "ITEMS_WRITE", "SALES_CREATE");

        String token = tokenProvider.generateAccessToken(userId, organizationId, permissions);

        assertThat(token).isNotBlank();
        assertThat(tokenProvider.validateToken(token)).isTrue();
        assertThat(tokenProvider.getUserIdFromToken(token)).isEqualTo(userId);
        assertThat(tokenProvider.getOrganizationIdFromToken(token)).isEqualTo(organizationId);
        assertThat(tokenProvider.getPermissionsFromToken(token)).containsExactlyElementsOf(permissions);
    }

    @Test
    @DisplayName("Expired token is rejected")
    void expiredTokenRejected() {
        // Expired provider with negative expiration time
        JwtTokenProvider expiredProvider = new JwtTokenProvider(SECRET, -1000L, -1000L);
        String expiredToken = expiredProvider.generateAccessToken("user-123", UUID.randomUUID(), List.of("READ"));

        boolean isValid = tokenProvider.validateToken(expiredToken);

        assertThat(isValid).isFalse();
    }

    @Test
    @DisplayName("Tampered token signature is rejected")
    void tamperedTokenRejected() {
        String userId = "user-123";
        UUID organizationId = UUID.randomUUID();
        String validToken = tokenProvider.generateAccessToken(userId, organizationId, List.of("ITEMS_READ"));

        // Tamper with the token string
        String tamperedToken = validToken.substring(0, validToken.length() - 4) + "XXXX";

        boolean isValid = tokenProvider.validateToken(tamperedToken);

        assertThat(isValid).isFalse();
    }

    @Test
    @DisplayName("Valid refresh token round-trip")
    void validRefreshTokenRoundTrip() {
        String userId = "user-456";
        UUID organizationId = UUID.randomUUID();

        String refreshToken = tokenProvider.generateRefreshToken(userId, organizationId);

        assertThat(refreshToken).isNotBlank();
        assertThat(tokenProvider.validateToken(refreshToken)).isTrue();
        assertThat(tokenProvider.getUserIdFromToken(refreshToken)).isEqualTo(userId);
        assertThat(tokenProvider.getOrganizationIdFromToken(refreshToken)).isEqualTo(organizationId);
    }
}
