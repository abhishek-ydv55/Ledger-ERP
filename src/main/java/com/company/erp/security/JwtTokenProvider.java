package com.company.erp.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Date;
import java.util.List;
import java.util.UUID;

@Component
public class JwtTokenProvider {

    private static final Logger log = LoggerFactory.getLogger(JwtTokenProvider.class);

    private final SecretKey key;
    private final long accessTokenExpirationMs;
    private final long refreshTokenExpirationMs;

    public JwtTokenProvider(
            @Value("${app.jwt.secret:404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970}") String secret,
            @Value("${app.jwt.access-token-expiry-ms:900000}") long accessTokenExpirationMs,
            @Value("${app.jwt.refresh-token-expiry-ms:604800000}") long refreshTokenExpirationMs
    ) {
        this.key = getSecretKey(secret);
        this.accessTokenExpirationMs = accessTokenExpirationMs;
        this.refreshTokenExpirationMs = refreshTokenExpirationMs;
    }

    private SecretKey getSecretKey(String secret) {
        try {
            byte[] keyBytes = Decoders.BASE64.decode(secret);
            if (keyBytes.length >= 32) {
                return Keys.hmacShaKeyFor(keyBytes);
            }
        } catch (Exception ignored) {
            // Fallback to SHA-256 hashing if secret string is raw text
        }
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(secret.getBytes(StandardCharsets.UTF_8));
            return Keys.hmacShaKeyFor(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 algorithm missing", e);
        }
    }

    public String generateAccessToken(String userId, String email, String fullName, UUID organizationId, List<String> permissions) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + accessTokenExpirationMs);

        var builder = Jwts.builder()
                .id(UUID.randomUUID().toString())
                .subject(userId)
                .claim("token_type", "access")
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(key);

        if (email != null && !email.isBlank()) {
            builder.claim("email", email);
        }

        if (fullName != null && !fullName.isBlank()) {
            builder.claim("name", fullName);
        }

        if (organizationId != null) {
            builder.claim("organizationId", organizationId.toString());
        }

        if (permissions != null && !permissions.isEmpty()) {
            builder.claim("permissions", permissions);
        }

        return builder.compact();
    }

    public String generateAccessToken(String userId, UUID organizationId, List<String> permissions) {
        return generateAccessToken(userId, null, null, organizationId, permissions);
    }

    public String generateRefreshToken(String userId, UUID organizationId) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + refreshTokenExpirationMs);

        var builder = Jwts.builder()
                .id(UUID.randomUUID().toString())
                .subject(userId)
                .claim("token_type", "refresh")
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(key);

        if (organizationId != null) {
            builder.claim("organizationId", organizationId.toString());
        }

        return builder.compact();
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parser().verifyWith(key).build().parseSignedClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            log.debug("Invalid JWT token: {}", e.getMessage());
            return false;
        }
    }

    public Claims getClaims(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public String getUserIdFromToken(String token) {
        return getClaims(token).getSubject();
    }

    public UUID getOrganizationIdFromToken(String token) {
        Claims claims = getClaims(token);
        String orgIdStr = claims.get("organizationId", String.class);
        return orgIdStr != null ? UUID.fromString(orgIdStr) : null;
    }

    @SuppressWarnings("unchecked")
    public List<String> getPermissionsFromToken(String token) {
        Claims claims = getClaims(token);
        return claims.get("permissions", List.class);
    }
}
