package com.company.erp.modules.auth.service;

import com.company.erp.modules.auth.dto.AuthResponse;
import com.company.erp.modules.auth.dto.LoginRequest;
import com.company.erp.modules.auth.dto.LogoutRequest;
import com.company.erp.modules.auth.dto.RefreshTokenRequest;

public interface AuthService {

    AuthResponse login(LoginRequest request);

    AuthResponse refreshToken(RefreshTokenRequest request);

    void logout(LogoutRequest request);
}
