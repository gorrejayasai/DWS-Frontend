import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { AdminService } from '../../../core/services/admin.service';
import { TransactionService } from '../../../core/services/transaction.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css'
})
export class AdminDashboardComponent implements OnInit {
  private auth = inject(AuthService);
  private adminSvc = inject(AdminService);
  private txSvc = inject(TransactionService);

  username = '';
  email = '';
  get initials(): string { return this.username.slice(0, 2).toUpperCase() || 'A'; }

  sidebarExpanded = false;

  totalUsers = 0;
  pendingKyc = 0;
  totalTransactions = 0;
  recentTransactions: any[] = [];
  recentUsers: any[] = [];

  ngOnInit(): void {
    const user = this.auth.getUser();
    this.username = user?.username ?? 'Admin';
    this.email = user?.email ?? '';
    this.loadData();
  }

  loadData(): void {
    this.adminSvc.getAllUsers(0, 5).subscribe({
      next: res => {
        this.totalUsers = res.totalElements;
        this.recentUsers = res.content;
      },
      error: () => {}
    });
    this.adminSvc.getAllKyc().subscribe({
      next: res => {
        this.pendingKyc = res.filter((k: any) => k.status === 'PENDING').length;
      },
      error: () => {}
    });
    this.adminSvc.getAllTransactions(0, 10).subscribe({
      next: res => {
        this.totalTransactions = res.totalElements;
        this.recentTransactions = res.content;
      },
      error: () => {}
    });
  }

  toggleSidebar(): void { this.sidebarExpanded = !this.sidebarExpanded; }
  logout(): void { this.auth.logout(); }

  fmt(n: number): string {
    return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  fmtDate(d: string): string {
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  statusClass(s: string): string {
    if (s === 'COMPLETED') return 'st-done';
    if (s === 'FAILED') return 'st-fail';
    return 'st-pend';
  }

  txSign(type: string): string { return type === 'TOPUP' ? '+' : '-'; }
  txAmtClass(type: string): string { return type === 'TOPUP' ? 'amt-in' : 'amt-out'; }
}
