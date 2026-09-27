export interface LoginRequest {
  email?: string;
  username?: string;
  password?: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface LogoutRequest {
  refreshToken: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
}

export interface JwtPayload {
  sub: string;
  email?: string;
  name?: string;
  organizationId?: string;
  permissions?: string[];
  token_type?: string;
  exp?: number;
  iat?: number;
  [key: string]: any;
}

export interface User {
  userId: string;
  email?: string;
  displayName?: string;
  organizationId?: string | null;
  permissions?: string[];
}
