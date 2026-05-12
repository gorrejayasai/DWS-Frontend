import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { AdminService } from '../../../core/services/admin.service';
import { KycResponse } from '../../../core/models/kyc.model';

@Component({
  selector: 'app-admin-kyc',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin-kyc.html',
  styleUrl: './admin-kyc.css'
})
export class AdminKycComponent implements OnInit {
  private auth = inject(AuthService);
  private adminSvc = inject(AdminService);

  username = '';
  get initials(): string { return this.username.slice(0, 2).toUpperCase() || 'A'; }

  sidebarExpanded = false;

  kycList: KycResponse[] = [];
  totalElements = 0;
  filterStatus = 'ALL';

  showRejectModal = false;
  rejectUserId = 0;
  rejectRemarks = '';

  ngOnInit(): void {
    const user = this.auth.getUser();
    this.username = user?.username ?? 'Admin';
    this.loadKyc();
  }

  loadKyc(): void {
    this.adminSvc.getAllKyc().subscribe({
      next: list => {
        this.kycList = list;
        this.totalElements = list.length;
      },
      error: () => {}
    });
  }

  get filteredKyc(): KycResponse[] {
    if (this.filterStatus === 'ALL') return this.kycList;
    return this.kycList.filter(k => k.status === this.filterStatus);
  }

  get pendingCount(): number  { return this.kycList.filter(k => k.status === 'PENDING').length; }
  get approvedCount(): number { return this.kycList.filter(k => k.status === 'APPROVED').length; }
  get rejectedCount(): number { return this.kycList.filter(k => k.status === 'REJECTED').length; }

  setFilter(f: string): void { this.filterStatus = f; }

  approve(userId: number): void {
    this.adminSvc.approveKyc(userId).subscribe({ next: () => this.loadKyc(), error: () => {} });
  }

  openRejectModal(userId: number): void {
    this.rejectUserId = userId;
    this.rejectRemarks = '';
    this.showRejectModal = true;
  }

  confirmReject(): void {
    if (!this.rejectRemarks.trim()) return;
    this.adminSvc.rejectKyc(this.rejectUserId, this.rejectRemarks).subscribe({
      next: () => { this.closeModal(); this.loadKyc(); },
      error: () => {}
    });
  }

  closeModal(): void {
    this.showRejectModal = false;
    this.rejectUserId = 0;
    this.rejectRemarks = '';
  }

  toggleSidebar(): void { this.sidebarExpanded = !this.sidebarExpanded; }
  logout(): void { this.auth.logout(); }

  fmtDate(d: string): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}
