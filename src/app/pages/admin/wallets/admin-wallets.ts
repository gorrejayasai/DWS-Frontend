import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { AdminService } from '../../../core/services/admin.service';
import { WalletService } from '../../../core/services/wallet.service';
import { WalletResponse } from '../../../core/models/wallet.model';

@Component({
  selector: 'app-admin-wallets',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin-wallets.html',
  styleUrl: './admin-wallets.css'
})
export class AdminWalletsComponent implements OnInit {
  private auth      = inject(AuthService);
  private adminSvc  = inject(AdminService);
  private walletSvc = inject(WalletService);

  username = '';
  get initials(): string { return this.username.slice(0, 2).toUpperCase() || 'A'; }

  sidebarExpanded = false;

  wallets: WalletResponse[] = [];
  listLoading = false;
  listError   = '';
  filterStatus = 'ALL';
  searchTerm   = '';

  actionLoading: number | null = null;
  actionSuccess = '';
  actionError   = '';

  showCloseConfirm: number | null = null;

  ngOnInit(): void {
    const user = this.auth.getUser();
    this.username = user?.username ?? 'Admin';
    this.loadWallets();
  }

  loadWallets(): void {
    this.listLoading = true;
    this.listError   = '';
    this.adminSvc.getAllWallets().subscribe({
      next: (res) => {
        this.wallets     = res ?? [];
        this.listLoading = false;
      },
      error: (err: any) => {
        const status = err?.status;
        if      (status === 403) this.listError = 'Access denied — admin role required.';
        else if (status === 0)   this.listError = 'Cannot reach server — is the backend running?';
        else                     this.listError = `Failed to load wallets (HTTP ${status ?? 'unknown'}).`;
        this.listLoading = false;
      }
    });
  }

  get filteredWallets(): WalletResponse[] {
    return this.wallets.filter(w => {
      const statusMatch = this.filterStatus === 'ALL' || w.status === this.filterStatus;
      const term        = this.searchTerm.trim().toLowerCase();
      const searchMatch = !term ||
        String(w.id) === term ||
        String(w.userId) === term;
      return statusMatch && searchMatch;
    });
  }

  get totalCount():  number { return this.wallets.length; }
  get activeCount(): number { return this.wallets.filter(w => w.status === 'ACTIVE').length; }
  get frozenCount(): number { return this.wallets.filter(w => w.status === 'FROZEN').length; }
  get closedCount(): number { return this.wallets.filter(w => w.status === 'CLOSED').length; }

  setFilter(f: string): void { this.filterStatus = f; }

  freeze(walletId: number): void {
    this.actionLoading = walletId;
    this.clearMessages();
    this.walletSvc.freezeWallet(walletId).subscribe({
      next: (w) => { this.updateWallet(w); this.showSuccess(`Wallet #${walletId} frozen.`); },
      error: (err) => { this.actionLoading = null; this.showError(err?.error?.message ?? 'Failed to freeze wallet.'); }
    });
  }

  unfreeze(walletId: number): void {
    this.actionLoading = walletId;
    this.clearMessages();
    this.walletSvc.unfreezeWallet(walletId).subscribe({
      next: (w) => { this.updateWallet(w); this.showSuccess(`Wallet #${walletId} unfrozen.`); },
      error: (err) => { this.actionLoading = null; this.showError(err?.error?.message ?? 'Failed to unfreeze wallet.'); }
    });
  }

  confirmClose(walletId: number): void { this.showCloseConfirm = walletId; }
  cancelClose(): void { this.showCloseConfirm = null; }

  doClose(): void {
    const walletId = this.showCloseConfirm!;
    this.showCloseConfirm = null;
    this.actionLoading = walletId;
    this.clearMessages();
    this.walletSvc.closeWallet(walletId).subscribe({
      next: (w) => { this.updateWallet(w); this.showSuccess(`Wallet #${walletId} closed permanently.`); },
      error: (err) => { this.actionLoading = null; this.showError(err?.error?.message ?? 'Failed to close wallet. Ensure balance is ₹0 first.'); }
    });
  }

  private updateWallet(w: WalletResponse): void {
    const idx = this.wallets.findIndex(x => x.id === w.id);
    if (idx !== -1) this.wallets = [...this.wallets.slice(0, idx), w, ...this.wallets.slice(idx + 1)];
    this.actionLoading = null;
  }
  private clearMessages(): void { this.actionSuccess = ''; this.actionError = ''; }
  private showSuccess(msg: string): void { this.actionSuccess = msg; setTimeout(() => this.actionSuccess = '', 4000); }
  private showError(msg: string): void   { this.actionError = msg;   setTimeout(() => this.actionError = '', 5000); }

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

  fmt(n: number | string): string {
    const num = typeof n === 'string' ? parseFloat(n) : n;
    return '₹' + (isNaN(num) ? '0.00' : num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  }

  statusClass(s: string): string {
    if (s === 'ACTIVE') return 'st-active';
    if (s === 'FROZEN') return 'st-frozen';
    return 'st-closed';
  }
}
