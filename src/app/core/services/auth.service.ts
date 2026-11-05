import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Observable, catchError, map, of, switchMap, tap } from 'rxjs';
import { environment } from '../../../environments/environments';
import { RefreshResponse, RegisterRequest, TokenResponse, User } from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/auth`;

  private readonly accessTokenKey = 'operations_access_token';
  private readonly refreshTokenKey = 'operations_refresh_token';

  private readonly userState = signal<User | null>(null);

  readonly currentUser = this.userState.asReadonly();
  readonly isAuthenticated = computed(() => this.userState() !== null);

  get accessToken(): string | null {
    return sessionStorage.getItem(this.accessTokenKey);
  }

  get refreshToken(): string | null {
    return sessionStorage.getItem(this.refreshTokenKey);
  }

  login(email: string, password: string): Observable<User> {
    return this.http.post<TokenResponse>(`${this.baseUrl}/login/`, { email, password }).pipe(
      tap((response) => {
        this.saveTokens(response.access, response.refresh);
        this.userState.set(response.user);
      }),
      map((response) => response.user),
    );
  }

  register(payload: RegisterRequest): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/register/`, payload);
  }

  getCurrentUser(): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/me/`).pipe(tap((user) => this.userState.set(user)));
  }

  refreshAccessToken(): Observable<RefreshResponse> {
    const refresh = this.refreshToken;

    if (!refresh) {
      this.clearSession();
      throw new Error('No refresh token is available.');
    }

    return this.http.post<RefreshResponse>(`${this.baseUrl}/refresh/`, { refresh }).pipe(
      tap((response) => {
        this.saveTokens(response.access, response.refresh ?? refresh);
      }),
    );
  }

  restoreSession(): Observable<User | null> {
    if (this.userState()) {
      return of(this.userState());
    }

    if (!this.refreshToken) {
      this.clearSession();
      return of(null);
    }

    return this.refreshAccessToken().pipe(
      switchMap(() => this.getCurrentUser()),
      catchError(() => {
        this.clearSession();
        return of(null);
      }),
    );
  }

  logout(): Observable<void> {
    const refresh = this.refreshToken;

    if (!refresh) {
      this.clearSession();
      return of(undefined);
    }

    return this.http.post<void>(`${this.baseUrl}/logout/`, { refresh }).pipe(
      catchError(() => of(undefined)),
      tap(() => this.clearSession()),
    );
  }

  clearSession(): void {
    sessionStorage.removeItem(this.accessTokenKey);
    sessionStorage.removeItem(this.refreshTokenKey);
    this.userState.set(null);
  }

  private saveTokens(access: string, refresh: string): void {
    sessionStorage.setItem(this.accessTokenKey, access);
    sessionStorage.setItem(this.refreshTokenKey, refresh);
  }
}
