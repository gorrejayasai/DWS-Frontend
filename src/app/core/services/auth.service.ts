import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  LoginRequest, LoginResponse,
  SignupRequest, SignupResponse,
  UserProfile, UpdateProfileRequest
} from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private readonly BASE = environment.apiUrl;
  private readonly TOKEN_KEY = 'pv_access_token';
  private readonly REFRESH_KEY = 'pv_refresh_token';
  private readonly USER_KEY = 'pv_user';

  private loggedIn$ = new BehaviorSubject<boolean>(this.hasToken());
  isLoggedIn$ = this.loggedIn$.asObservable();

  // ─── Auth endpoints ───────────────────────────────────────────

  login(payload: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.BASE}/user/auth/login`, payload).pipe(
      tap(res => {
        localStorage.setItem(this.TOKEN_KEY, res.jwt);
        localStorage.setItem(this.REFRESH_KEY, res.refreshToken);
        localStorage.setItem(this.USER_KEY, JSON.stringify({
          userId: res.userId,
          username: res.username,
          email: res.email,
          role: res.role,
          status: res.status
        }));
        this.loggedIn$.next(true);
      })
    );
  }

  signup(payload: SignupRequest): Observable<SignupResponse> {
    return this.http.post<SignupResponse>(`${this.BASE}/user/auth/signup`, payload);
  }

  logout(navigate = true): void {
    const token = this.getToken();
    if (token) {
      this.http.post(`${this.BASE}/user/auth/logout`, {}).subscribe({
        error: () => {} // ignore errors on logout
      });
    }
    this.clearSession();
    if (navigate) this.router.navigate(['/login']);
  }

  refreshToken(): Observable<LoginResponse> {
    const refresh = localStorage.getItem(this.REFRESH_KEY) ?? '';
    return this.http.post<LoginResponse>(`${this.BASE}/user/auth/refresh-token`, { refreshToken: refresh }).pipe(
      tap(res => {
        localStorage.setItem(this.TOKEN_KEY, res.jwt);
        localStorage.setItem(this.REFRESH_KEY, res.refreshToken);
      })
    );
  }

  // ─── Profile endpoints ────────────────────────────────────────

  getProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.BASE}/user/getProfile`);
  }

  updateProfile(payload: UpdateProfileRequest): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${this.BASE}/user/updateProfile`, payload).pipe(
      tap(res => {
        const stored = this.getStoredUser();
        if (stored) {
          stored.username = res.username;
          stored.email = res.email;
          localStorage.setItem(this.USER_KEY, JSON.stringify(stored));
        }
      })
    );
  }

  // ─── Token helpers ────────────────────────────────────────────

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  hasToken(): boolean {
    return !!localStorage.getItem(this.TOKEN_KEY);
  }

  isLoggedIn(): boolean {
    return this.hasToken();
  }

  isAdmin(): boolean {
    return this.getStoredUser()?.role === 'ADMIN';
  }

  getStoredUser(): any {
    const raw = localStorage.getItem(this.USER_KEY);
    return raw ? JSON.parse(raw) : null;
  }

  /** Alias used by dashboard and profile components */
  getUser(): any {
    return this.getStoredUser();
  }

  
getUsername(): string | null {
  return this.getStoredUser()?.username ?? null;
}


  private clearSession(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.loggedIn$.next(false);
  }
}
