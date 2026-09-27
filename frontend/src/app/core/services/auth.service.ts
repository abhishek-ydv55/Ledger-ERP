import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { AuthResponse, JwtPayload, LoginRequest, User } from '../models/auth.models';
import { TenantService } from './tenant.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly tenantService = inject(TenantService);

  private readonly baseUrl = `${environment.apiBaseUrl}/auth`;
  private readonly refreshTokenKey = 'erp_refresh_token';

  // Held in memory ONLY - private field
  private accessToken: string | null = null;

  readonly currentUser = signal<User | null>(null);
  readonly isAuthenticated = signal<boolean>(false);
  readonly isInitialized = signal<boolean>(false);

  getAccessToken(): string | null {
    return this.accessToken;
  }

  getStoredRefreshToken(): string | null {
    return localStorage.getItem(this.refreshTokenKey);
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.baseUrl}/login`, credentials).pipe(
      map(res => res.data),
      tap(data => this.handleAuthSuccess(data))
    );
  }

  refreshToken(): Observable<AuthResponse> {
    const refreshToken = this.getStoredRefreshToken();
    if (!refreshToken) {
      this.clearAuth();
      return throwError(() => new Error('No refresh token available'));
    }

    return this.http.post<ApiResponse<AuthResponse>>(`${this.baseUrl}/refresh`, { refreshToken }).pipe(
      map(res => res.data),
      tap(data => this.handleAuthSuccess(data)),
      catchError(err => {
        this.clearAuth();
        return throwError(() => err);
      })
    );
  }

  logout(): void {
    const refreshToken = this.getStoredRefreshToken();
    if (refreshToken) {
      this.http.post<ApiResponse<void>>(`${this.baseUrl}/logout`, { refreshToken }).subscribe({
        error: () => {} // Ignore errors on logout
      });
    }
    this.clearAuth();
    this.router.navigate(['/auth/login']);
  }

  initAuth(): Observable<boolean> {
    const refreshToken = this.getStoredRefreshToken();
    if (!refreshToken) {
      this.clearAuth();
      this.isInitialized.set(true);
      return of(false);
    }

    return this.refreshToken().pipe(
      map(() => true),
      catchError(() => of(false)),
      tap(() => this.isInitialized.set(true))
    );
  }

  private handleAuthSuccess(data: AuthResponse): void {
    this.accessToken = data.accessToken;
    if (data.refreshToken) {
      localStorage.setItem(this.refreshTokenKey, data.refreshToken);
    }

    const payload = this.decodeJwt(data.accessToken);
    if (payload) {
      const email = payload['email'] || payload.sub;
      const displayName = payload['name'] || email;
      const user: User = {
        userId: payload.sub,
        email: email,
        displayName: displayName,
        organizationId: payload.organizationId || null,
        permissions: payload.permissions || []
      };
      this.currentUser.set(user);
      this.tenantService.setTenantId(payload.organizationId || null);
    }

    this.isAuthenticated.set(true);
  }

  private clearAuth(): void {
    this.accessToken = null;
    localStorage.removeItem(this.refreshTokenKey);
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
    this.tenantService.clear();
  }

  private decodeJwt(token: string): JwtPayload | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const payload = parts[1];
      const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch {
      return null;
    }
  }
}
