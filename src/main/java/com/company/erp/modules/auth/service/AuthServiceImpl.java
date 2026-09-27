package com.company.erp.modules.auth.service;

import com.company.erp.common.exception.BusinessRuleViolationException;
import com.company.erp.modules.auth.dto.AuthResponse;
import com.company.erp.modules.auth.dto.LoginRequest;
import com.company.erp.modules.auth.dto.LogoutRequest;
import com.company.erp.modules.auth.dto.RefreshTokenRequest;
import com.company.erp.modules.auth.entity.RefreshToken;
import com.company.erp.modules.auth.repository.RefreshTokenRepository;
import com.company.erp.modules.users.entity.Permission;
import com.company.erp.modules.users.entity.Role;
import com.company.erp.modules.users.entity.User;
import com.company.erp.modules.users.repository.UserRepository;
import com.company.erp.security.JwtTokenProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.HexFormat;
import java.util.List;

@Service
@Transactional
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtTokenProvider tokenProvider;
    private final PasswordEncoder passwordEncoder;
    private final long refreshTokenExpirationMs;

    public AuthServiceImpl(
            UserRepository userRepository,
            RefreshTokenRepository refreshTokenRepository,
            JwtTokenProvider tokenProvider,
            PasswordEncoder passwordEncoder,
            @Value("${app.jwt.refresh-token-expiry-ms:604800000}") long refreshTokenExpirationMs
    ) {
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.tokenProvider = tokenProvider;
        this.passwordEncoder = passwordEncoder;
        this.refreshTokenExpirationMs = refreshTokenExpirationMs;
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new BusinessRuleViolationException("Invalid email or password"));

        if (!user.isActive()) {
            throw new BusinessRuleViolationException("User account is inactive");
        }

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new BusinessRuleViolationException("Invalid email or password");
        }

        List<String> permissions = extractPermissions(user);
        String fullName = buildFullName(user);

        String accessToken = tokenProvider.generateAccessToken(
                user.getId().toString(),
                user.getEmail(),
                fullName,
                user.getOrganizationId(),
                permissions
        );

        String rawRefreshToken = tokenProvider.generateRefreshToken(
                user.getId().toString(),
                user.getOrganizationId()
        );

        saveRefreshToken(user.getId(), rawRefreshToken);

        return new AuthResponse(accessToken, rawRefreshToken, 900);
    }

    @Override
    public AuthResponse refreshToken(RefreshTokenRequest request) {
        String rawToken = request.refreshToken();

        if (!tokenProvider.validateToken(rawToken)) {
            throw new BusinessRuleViolationException("Invalid or expired refresh token");
        }

        String hash = hashToken(rawToken);
        RefreshToken storedToken = refreshTokenRepository.findByTokenHash(hash)
                .orElseThrow(() -> new BusinessRuleViolationException("Refresh token not found or revoked"));

        if (storedToken.isRevoked() || storedToken.getExpiresAt().isBefore(Instant.now())) {
            throw new BusinessRuleViolationException("Refresh token has been revoked or expired");
        }

        // Revoke old refresh token
        storedToken.setRevoked(true);
        refreshTokenRepository.save(storedToken);

        User user = userRepository.findById(storedToken.getUserId())
                .orElseThrow(() -> new BusinessRuleViolationException("User associated with token not found"));

        List<String> permissions = extractPermissions(user);
        String fullName = buildFullName(user);

        String newAccessToken = tokenProvider.generateAccessToken(
                user.getId().toString(),
                user.getEmail(),
                fullName,
                user.getOrganizationId(),
                permissions
        );

        String newRawRefreshToken = tokenProvider.generateRefreshToken(
                user.getId().toString(),
                user.getOrganizationId()
        );

        saveRefreshToken(user.getId(), newRawRefreshToken);

        return new AuthResponse(newAccessToken, newRawRefreshToken, 900);
    }

    @Override
    public void logout(LogoutRequest request) {
        String hash = hashToken(request.refreshToken());
        refreshTokenRepository.findByTokenHash(hash).ifPresent(token -> {
            token.setRevoked(true);
            refreshTokenRepository.save(token);
        });
    }

    private void saveRefreshToken(java.util.UUID userId, String rawToken) {
        String hash = hashToken(rawToken);
        Instant expiresAt = Instant.now().plusMillis(refreshTokenExpirationMs);
        RefreshToken refreshToken = new RefreshToken(userId, hash, expiresAt);
        refreshTokenRepository.save(refreshToken);
    }

    private String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(token.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hashBytes);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 algorithm missing", e);
        }
    }

    private List<String> extractPermissions(User user) {
        if (user.getRoles() == null) {
            return List.of();
        }
        return user.getRoles().stream()
                .filter(role -> role.getPermissions() != null)
                .flatMap(role -> role.getPermissions().stream())
                .map(Permission::getCode)
                .distinct()
                .toList();
    }

    private String buildFullName(User user) {
        String first = user.getFirstName() != null ? user.getFirstName().trim() : "";
        String last = user.getLastName() != null ? user.getLastName().trim() : "";
        String full = (first + " " + last).trim();
        return full.isEmpty() ? user.getEmail() : full;
    }
}
