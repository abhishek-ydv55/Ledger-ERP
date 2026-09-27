import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { AppError } from '../models/app-error.model';
import { ToastService } from './toast.service';

export interface ApiRequestOptions {
  params?: HttpParams | { [param: string]: any };
  headers?: HttpHeaders | { [header: string]: string | string[] };
  suppressToast?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly toastService = inject(ToastService);
  private readonly baseUrl = environment.apiBaseUrl;

  get<T>(path: string, options?: ApiRequestOptions): Observable<T> {
    return this.http.get<ApiResponse<T>>(`${this.baseUrl}${path}`, {
      params: options?.params,
      headers: options?.headers
    }).pipe(
      map(res => this.unwrapResponse(res)),
      catchError(err => this.handleError(err, options))
    );
  }

  post<T>(path: string, body: any, options?: ApiRequestOptions): Observable<T> {
    return this.http.post<ApiResponse<T>>(`${this.baseUrl}${path}`, body, {
      params: options?.params,
      headers: options?.headers
    }).pipe(
      map(res => this.unwrapResponse(res)),
      catchError(err => this.handleError(err, options))
    );
  }

  put<T>(path: string, body: any, options?: ApiRequestOptions): Observable<T> {
    return this.http.put<ApiResponse<T>>(`${this.baseUrl}${path}`, body, {
      params: options?.params,
      headers: options?.headers
    }).pipe(
      map(res => this.unwrapResponse(res)),
      catchError(err => this.handleError(err, options))
    );
  }

  patch<T>(path: string, body: any, options?: ApiRequestOptions): Observable<T> {
    return this.http.patch<ApiResponse<T>>(`${this.baseUrl}${path}`, body, {
      params: options?.params,
      headers: options?.headers
    }).pipe(
      map(res => this.unwrapResponse(res)),
      catchError(err => this.handleError(err, options))
    );
  }

  delete<T>(path: string, options?: ApiRequestOptions): Observable<T> {
    return this.http.delete<ApiResponse<T>>(`${this.baseUrl}${path}`, {
      params: options?.params,
      headers: options?.headers
    }).pipe(
      map(res => this.unwrapResponse(res)),
      catchError(err => this.handleError(err, options))
    );
  }

  private unwrapResponse<T>(res: ApiResponse<T>): T {
    if (res && res.success === false) {
      throw {
        message: res.message || 'Operation failed',
        errors: res.errors || undefined,
        timestamp: res.timestamp
      } as AppError;
    }
    return res.data;
  }

  private handleError(err: any, options?: ApiRequestOptions): Observable<never> {
    let appError: AppError;

    if (err instanceof HttpErrorResponse) {
      const backendErr = err.error as ApiResponse<any> | undefined;
      appError = {
        status: err.status,
        message: backendErr?.message || err.error?.message || err.statusText || 'An unexpected error occurred',
        errors: backendErr?.errors || (Array.isArray(err.error?.errors) ? err.error.errors : null),
        timestamp: backendErr?.timestamp
      };
    } else if (err && typeof err === 'object' && 'message' in err) {
      appError = err as AppError;
    } else {
      appError = {
        message: 'An unknown server error occurred'
      };
    }

    if (!options?.suppressToast) {
      this.toastService.error(appError.message, 'API Error');
    }

    return throwError(() => appError);
  }
}
