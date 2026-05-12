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
  private auth = inject(AuthService);
  private adminSvc = inject(AdminService);

  username = '';
  email = '';
  get initials(): string { return this.username.slice(0, 2).toUpperCase() || 'A'; }

  sidebarExpanded = false;

  users: any[] = [];
  totalElements = 0;
  totalPages = 0;
  currentPage = 0;
  pageSize = 10;

  filterStatus = 'ALL';
  searchTerm = '';

  ngOnInit(): void {
    const user = this.auth.getUser();
    this.username = user?.username ?? 'Admin';
    this.email = user?.email ?? '';
    this.loadUsers();
  }

  loadUsers(): void {
    this.adminSvc.getAllUsers(this.currentPage, this.pageSize).subscribe({
      next: res => {
        this.users = res.content;
        this.totalElements = res.totalElements;
        this.totalPages = res.totalPages;
      },
      error: () => {}
    });
  }

  get filteredUsers(): any[] {
    return this.users.filter(u => {
      const statusMatch = this.filterStatus === 'ALL' || u.status === this.filterStatus;
      const term = this.searchTerm.toLowerCase();
      const searchMatch = !term ||
        u.username?.toLowerCase().includes(term) ||
        u.email?.toLowerCase().includes(term);
      return statusMatch && searchMatch;
    });
  }

  get totalUsers(): number { return this.users.length; }
  get activeUsers(): number { return this.users.filter(u => u.status === 'ACTIVE').length; }

  setFilter(f: string): void { this.filterStatus = f; }

  prevPage(): void {
    if (this.currentPage > 0) { this.currentPage--; this.loadUsers(); }
  }
  nextPage(): void {
    if (this.currentPage < this.totalPages - 1) { this.currentPage++; this.loadUsers(); }
  }

  toggleSidebar(): void { this.sidebarExpanded = !this.sidebarExpanded; }
  logout(): void { this.auth.logout(); }

  fmtDate(d: string): string {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  userInitials(name: string): string { return (name || '?').slice(0, 2).toUpperCase(); }
}
