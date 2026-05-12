import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { AdminService } from '../../../core/services/admin.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css'
})
export class AdminDashboardComponent implements OnInit {
  private auth     = inject(AuthService);
  private adminSvc = inject(AdminService);

  username = '';
  email    = '';
  get initials(): string { return this.username.slice(0, 2).toUpperCase() || 'A'; }

  sidebarExpanded = false;

  totalUsers        = 0;   // derived from KYC approved count
  pendingKyc        = 0;
  approvedKyc       = 0;
  rejectedKyc       = 0;
  totalKyc          = 0;
  recentKyc:  any[] = [];

  ngOnInit(): void {
    const user   = this.auth.getUser();
    this.username = user?.username ?? 'Admin';
    this.email    = user?.email ?? '';
    this.loadData();
  }

  loadData(): void {
    this.adminSvc.getAllKyc().subscribe({
      next: (res: any[]) => {
        const list       = res ?? [];
        this.totalKyc    = list.length;
        this.pendingKyc  = list.filter((k: any) => k.status === 'PENDING').length;
        this.approvedKyc = list.filter((k: any) => k.status === 'APPROVED').length;
        this.rejectedKyc = list.filter((k: any) => k.status === 'REJECTED').length;
        this.totalUsers  = this.approvedKyc;   // users with wallet = approved KYC
        // show the 5 most recently submitted
        this.recentKyc   = [...list]
          .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
          .slice(0, 5);
      },
      error: () => { /* dashboard shows zeroes on failure */ }
    });
  }

  toggleSidebar(): void { this.sidebarExpanded = !this.sidebarExpanded; }
  logout(): void { this.auth.logout(); }

  fmtDate(d: string): string {
    if (!d) return '—';
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return '—';
    return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  kycStatusClass(s: string): string {
    if (s === 'APPROVED') return 'st-done';
    if (s === 'REJECTED') return 'st-fail';
    if (s === 'PENDING')  return 'st-pend';
    return 'st-pend';
  }
}
