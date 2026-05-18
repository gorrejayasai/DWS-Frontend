import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpBackend, HttpClient } from '@angular/common/http';
import { catchError, of, timeout } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';

export type SvcStatus = 'CHECKING' | 'UP' | 'DOWN' | 'INTERNAL';

export interface ServiceInfo {
  name: string;
  port: number;
  description: string;
  status: SvcStatus;
  latency: number | null;
  lastChecked: Date | null;
  checkUrl: string | null;  // null = not reachable through gateway
}

@Component({
  selector: 'app-admin-health',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-health.html',
  styleUrl: './admin-health.css'
})
export class AdminHealthComponent implements OnInit, OnDestroy {
  private auth    = inject(AuthService);
  private handler = inject(HttpBackend);   // bypass JWT interceptor
  private http!: HttpClient;              // raw client — no interceptors

  private BASE = environment.apiUrl;

  username = '';
  get initials(): string { return this.username.slice(0, 2).toUpperCase() || 'A'; }

  sidebarExpanded = false;
  checking = false;
  lastFullCheck: Date | null = null;
  private timer: any = null;
  autoRefreshSecs = 30;
  countdown = 0;

  services: ServiceInfo[] = [
    {
      name: 'API Gateway',
      port: 8081,
      description: 'Entry point — routes + auth filter',
      status: 'CHECKING',
      latency: null,
      lastChecked: null,
      checkUrl: `${environment.apiUrl}/user/auth/validate`  // public endpoint, no token needed
    },
    {
      name: 'User Service',
      port: 8082,
      description: 'Auth, JWT, user profiles',
      status: 'CHECKING',
      latency: null,
      lastChecked: null,
      checkUrl: `${environment.apiUrl}/user/getProfile`
    },
    {
      name: 'KYC Service',
      port: 8083,
      description: 'Identity verification, documents',
      status: 'CHECKING',
      latency: null,
      lastChecked: null,
      checkUrl: `${environment.apiUrl}/kyc/admin/all`
    },
    {
      name: 'Wallet Service',
      port: 8084,
      description: 'Balances, topup, transfer, withdraw',
      status: 'CHECKING',
      latency: null,
      lastChecked: null,
      checkUrl: `${environment.apiUrl}/wallets/by-user`
    },
    {
      name: 'Transaction Service',
      port: 8085,
      description: 'Ledger, idempotency, history',
      status: 'CHECKING',
      latency: null,
      lastChecked: null,
      checkUrl: `${environment.apiUrl}/transactions/me?page=0&size=1`
    },
    {
      name: 'Notification Service',
      port: 8086,
      description: 'Async email / SMS alerts',
      status: 'INTERNAL',
      latency: null,
      lastChecked: null,
      checkUrl: null  // called internally by Wallet Service via Feign, no public gateway route
    },
    {
      name: 'Eureka Server',
      port: 8761,
      description: 'Service discovery registry',
      status: 'INTERNAL',
      latency: null,
      lastChecked: null,
      checkUrl: null  // internal only, no gateway route
    }
  ];

  ngOnInit(): void {
    this.http = new HttpClient(this.handler);
    const user = this.auth.getUser();
    this.username = user?.username ?? 'Admin';
    this.checkAll();
    this.startAutoRefresh();
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  // ── Computed ─────────────────────────────────────────────────────────────────

  get checkableServices(): ServiceInfo[] {
    return this.services.filter(s => s.checkUrl !== null);
  }

  get allUp(): boolean {
    return this.checkableServices.every(s => s.status === 'UP');
  }

  get upCount(): number {
    return this.checkableServices.filter(s => s.status === 'UP').length;
  }

  get downCount(): number {
    return this.checkableServices.filter(s => s.status === 'DOWN').length;
  }

  get checkingCount(): number {
    return this.checkableServices.filter(s => s.status === 'CHECKING').length;
  }

  get overallStatus(): 'ok' | 'degraded' | 'checking' {
    if (this.checkingCount > 0) return 'checking';
    if (this.downCount > 0) return 'degraded';
    return 'ok';
  }

  // ── Health check logic ───────────────────────────────────────────────────────

  checkAll(): void {
    this.checking = true;
    this.services.forEach(svc => {
      if (svc.checkUrl) svc.status = 'CHECKING';
    });

    const token = this.auth.getToken();
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
    let pending = this.checkableServices.length;

    this.checkableServices.forEach(svc => {
      const start = Date.now();
      this.http.get(svc.checkUrl!, { headers, observe: 'response' }).pipe(
        timeout(6000),
        catchError((err: any) => {
          // err.status === 0 → network error / CORS / service unreachable
          // err.status > 0 → service IS running but returned an HTTP error (401,403,404…)
          // TimeoutError → no response within 6 s
          if (err?.status > 0) {
            // Got an HTTP response — service is UP, just rejected our request
            return of({ ok: true, status: err.status, latency: Date.now() - start });
          }
          return of({ ok: false, latency: null });
        })
      ).subscribe((res: any) => {
        const latency = res.latency ?? (Date.now() - start);
        svc.latency = res.ok !== false ? latency : null;
        svc.status  = res.ok !== false ? 'UP' : 'DOWN';
        svc.lastChecked = new Date();
        pending--;
        if (pending <= 0) {
          this.checking = false;
          this.lastFullCheck = new Date();
        }
      });
    });
  }

  // ── Auto-refresh countdown ───────────────────────────────────────────────────

  private startAutoRefresh(): void {
    this.countdown = this.autoRefreshSecs;
    this.timer = setInterval(() => {
      this.countdown--;
      if (this.countdown <= 0) {
        this.countdown = this.autoRefreshSecs;
        this.checkAll();
      }
    }, 1000);
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────

  latencyClass(ms: number | null): string {
    if (ms === null) return '';
    if (ms < 200)  return 'lat-fast';
    if (ms < 800)  return 'lat-ok';
    return 'lat-slow';
  }

  latencyLabel(ms: number | null): string {
    if (ms === null) return '—';
    if (ms < 1000) return `${ms} ms`;
    return `${(ms / 1000).toFixed(1)} s`;
  }

  fmtTime(d: Date | null): string {
    if (!d) return '—';
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  showLogoutModal = false;
  toggleSidebar(): void { this.sidebarExpanded = !this.sidebarExpanded; }
  logout(): void { this.showLogoutModal = true; }
  closeLogoutModal(): void { this.showLogoutModal = false; }
  doLogout(): void { this.showLogoutModal = false; this.auth.logout(); }
}
