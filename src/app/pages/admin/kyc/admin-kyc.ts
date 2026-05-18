import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { AdminService } from '../../../core/services/admin.service';
import { KycService } from '../../../core/services/kyc.service';
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
  private kycSvc = inject(KycService);

  username = '';
  get initials(): string { return this.username.slice(0, 2).toUpperCase() || 'A'; }

  sidebarExpanded = false;

  kycList: KycResponse[] = [];
  totalElements = 0;
  filterStatus = 'ALL';
  listLoading = false;
  listError = '';

  actionLoading = false;
  actionError = '';
  actionSuccess = '';

  showRejectModal = false;
  rejectUserId = 0;
  rejectRemarks = '';

  docLoading: number | null = null;

  ngOnInit(): void {
    const user = this.auth.getUser();
    this.username = user?.username ?? 'Admin';
    this.loadKyc();
  }

  loadKyc(): void {
    this.listLoading = true;
    this.listError = '';
    this.adminSvc.getAllKyc().subscribe({
      next: list => {
        this.kycList = list;
        this.totalElements = list.length;
        this.listLoading = false;
      },
      error: () => {
        this.listError = 'Failed to load KYC records.';
        this.listLoading = false;
      }
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
    this.actionLoading = true;
    this.actionError = '';
    this.actionSuccess = '';
    this.adminSvc.approveKyc(userId).subscribe({
      next: () => {
        this.actionLoading = false;
        this.actionSuccess = `KYC for User #${userId} approved.`;
        this.loadKyc();
        setTimeout(() => this.actionSuccess = '', 3000);
      },
      error: (err) => {
        this.actionLoading = false;
        this.actionError = err?.error?.message ?? `Failed to approve KYC for User #${userId}.`;
        setTimeout(() => this.actionError = '', 4000);
      }
    });
  }

  openRejectModal(userId: number): void {
    this.rejectUserId = userId;
    this.rejectRemarks = '';
    this.showRejectModal = true;
  }

  confirmReject(): void {
    if (!this.rejectRemarks.trim()) return;
    this.actionLoading = true;
    this.actionError = '';
    this.actionSuccess = '';
    const uid = this.rejectUserId;
    this.adminSvc.rejectKyc(uid, this.rejectRemarks.trim()).subscribe({
      next: () => {
        this.actionLoading = false;
        this.actionSuccess = `KYC for User #${uid} rejected.`;
        this.closeModal();
        this.loadKyc();
        setTimeout(() => this.actionSuccess = '', 3000);
      },
      error: (err) => {
        this.actionLoading = false;
        this.actionError = err?.error?.message ?? `Failed to reject KYC for User #${uid}.`;
        this.closeModal();
        setTimeout(() => this.actionError = '', 4000);
      }
    });
  }

  closeModal(): void {
    this.showRejectModal = false;
    this.rejectUserId = 0;
    this.rejectRemarks = '';
  }

  openDocument(docId: number): void {
    this.docLoading = docId;
    this.kycSvc.viewDocument(docId).subscribe({
      next: blob => {
        this.docLoading = null;
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 30000);
      },
      error: () => {
        this.docLoading = null;
        this.actionError = 'Failed to load document. Please try again.';
        setTimeout(() => this.actionError = '', 4000);
      }
    });
  }

  showLogoutModal = false;
  toggleSidebar(): void { this.sidebarExpanded = !this.sidebarExpanded; }
  logout(): void { this.showLogoutModal = true; }
  closeLogoutModal(): void { this.showLogoutModal = false; }
  doLogout(): void { this.showLogoutModal = false; this.auth.logout(); }

  fmtDate(d: string | null | undefined): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}
