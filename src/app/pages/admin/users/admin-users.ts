import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { AdminService } from '../../../core/services/admin.service';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin-users.html',
  styleUrl: './admin-users.css'
})
export class AdminUsersComponent implements OnInit {
  private auth     = inject(AuthService);
  private adminSvc = inject(AdminService);

  username = '';
  email    = '';
  get initials(): string { return this.username.slice(0, 2).toUpperCase() || 'A'; }

  sidebarExpanded = false;

  kycList: any[]  = [];
  listLoading     = false;
  listError       = '';
  filterStatus    = 'ALL';
  searchTerm      = '';

  ngOnInit(): void {
    const user = this.auth.getUser();
    this.username = user?.username ?? 'Admin';
    this.email    = user?.email ?? '';
    this.loadUsers();
  }

  loadUsers(): void {
    this.listLoading = true;
    this.listError   = '';
    this.adminSvc.getAllKyc().subscribe({
      next: (res: any[]) => {
        this.kycList    = res ?? [];
        this.listLoading = false;
      },
      error: (err: any) => {
        const status = err?.status;
        if      (status === 403) this.listError = 'Access denied — admin role required (HTTP 403).';
        else if (status === 0)   this.listError = 'Cannot reach server — is the backend running?';
        else                     this.listError = `Failed to load data (HTTP ${status ?? 'unknown'}).`;
        this.listLoading = false;
      }
    });
  }

  get filteredUsers(): any[] {
    return this.kycList.filter(k => {
      const statusMatch = this.filterStatus === 'ALL' || k.status === this.filterStatus;
      const term        = this.searchTerm.toLowerCase();
      const searchMatch = !term || String(k.userId).includes(term);
      return statusMatch && searchMatch;
    });
  }

  get totalKycUsers():  number { return this.kycList.length; }
  get pendingCount():   number { return this.kycList.filter(k => k.status === 'PENDING').length;  }
  get approvedCount():  number { return this.kycList.filter(k => k.status === 'APPROVED').length; }
  get rejectedCount():  number { return this.kycList.filter(k => k.status === 'REJECTED').length; }

  setFilter(f: string): void { this.filterStatus = f; }

  showLogoutModal = false;
  toggleSidebar(): void { this.sidebarExpanded = !this.sidebarExpanded; }
  logout(): void { this.showLogoutModal = true; }
  closeLogoutModal(): void { this.showLogoutModal = false; }
  doLogout(): void { this.showLogoutModal = false; this.auth.logout(); }

  fmtDate(d: string): string {
    if (!d) return '—';
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return '—';
    return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  kycStatusClass(s: string): string {
    if (s === 'APPROVED') return 'st-approved';
    if (s === 'REJECTED')  return 'st-rejected';
    if (s === 'PENDING')   return 'st-pending';
    return 'st-other';
  }
}
