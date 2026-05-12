import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { WalletService } from '../../core/services/wallet.service';
import { TransactionService } from '../../core/services/transaction.service';
import { WalletResponse } from '../../core/models/wallet.model';
import { TransactionResponse } from '../../core/models/transaction.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class DashboardComponent implements OnInit {
  private auth      = inject(AuthService);
  private walletSvc = inject(WalletService);
  private txSvc     = inject(TransactionService);

  // ─── User info ─────────────────────────────────────────────────────────────
  username = '';
  email    = '';

  get initials(): string {
    return this.username.slice(0, 2).toUpperCase() || 'U';
  }

  get greeting(): string {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }

  // ─── Wallet ─────────────────────────────────────────────────────────────────
  wallet: WalletResponse | null = null;
  walletLoading = true;
  walletError   = '';

  // ─── Transactions ───────────────────────────────────────────────────────────
  transactions: TransactionResponse[] = [];
  txLoading     = true;
  txError       = '';
  currentPage   = 0;
  totalPages    = 1;
  totalElements = 0;
  pageSize      = 5;

  // ─── Computed stats ─────────────────────────────────────────────────────────
  get totalReceived(): number {
    return this.transactions
      .filter(t => t.type === 'TOPUP' && t.status === 'COMPLETED')
      .reduce((s, t) => s + t.amount, 0);
  }

  get totalSent(): number {
    return this.transactions
      .filter(t => (t.type === 'TRANSFER' || t.type === 'WITHDRAW') && t.status === 'COMPLETED')
      .reduce((s, t) => s + t.amount, 0);
  }

  get pendingCount(): number {
    return this.transactions.filter(t => t.status === 'PENDING').length;
  }

  // ─── Lifecycle ──────────────────────────────────────────────────────────────
  ngOnInit(): void {
    const user = this.auth.getUser();
    this.username = user?.username ?? 'User';
    this.email    = user?.email    ?? '';
    this.loadWallet();
    this.loadTransactions(0);
  }

  // ─── Data loaders ───────────────────────────────────────────────────────────
  loadWallet(): void {
    this.walletLoading = true;
    this.walletError   = '';
    this.walletSvc.getMyWallet().subscribe({
      next: w => { this.wallet = w; this.walletLoading = false; },
      error: err => {
        this.walletLoading = false;
        this.walletError = err.status === 404
          ? 'no-wallet'
          : 'Could not load wallet.';
      }
    });
  }

  loadTransactions(page: number): void {
    this.txLoading = true;
    this.txError   = '';
    this.txSvc.getMyTransactions(page, this.pageSize).subscribe({
      next: res => {
        this.transactions  = res.content;
        this.currentPage   = res.currentPage;
        this.totalPages    = res.totalPages;
        this.totalElements = res.totalElements;
        this.txLoading     = false;
      },
      error: () => {
        this.txLoading = false;
        this.txError   = 'Could not load transactions.';
      }
    });
  }

  prevPage(): void { if (this.currentPage > 0) this.loadTransactions(this.currentPage - 1); }
  nextPage(): void { if (this.currentPage < this.totalPages - 1) this.loadTransactions(this.currentPage + 1); }

  logout(): void { this.auth.logout(); }

  // ─── Display helpers ────────────────────────────────────────────────────────
  formatAmount(n: number): string {
    return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  formatAmountShort(n: number): string {
    if (n >= 10_000_000) return '₹' + (n / 10_000_000).toFixed(1) + 'Cr';
    if (n >= 100_000)    return '₹' + (n / 100_000).toFixed(1) + 'L';
    if (n >= 1_000)      return '₹' + (n / 1_000).toFixed(1) + 'K';
    return '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 });
  }

  formatDate(d: string): string {
    const dt = new Date(d);
    const today = new Date();
    const isToday = dt.toDateString() === today.toDateString();
    if (isToday) {
      return 'Today, ' + dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    }
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (dt.toDateString() === yesterday.toDateString()) {
      return 'Yesterday, ' + dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    }
    return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) +
      ', ' + dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  }

  txIconClass(type: string): string {
    if (type === 'TOPUP')    return 'ti-in';
    if (type === 'WITHDRAW') return 'ti-out';
    return 'ti-transfer';
  }

  txLabel(tx: TransactionResponse): string {
    if (tx.type === 'TOPUP')    return 'Wallet Top Up';
    if (tx.type === 'WITHDRAW') return 'Withdrawal';
    return tx.targetWalletId ? `Transfer #${tx.targetWalletId}` : 'Transfer';
  }

  txAmtClass(type: string): string {
    if (type === 'TOPUP') return 'amt-in';
    return 'amt-out';
  }

  txSign(type: string): string {
    return type === 'TOPUP' ? '+' : '-';
  }

  statusClass(s: string): string {
    if (s === 'COMPLETED') return 'st-done';
    if (s === 'FAILED')    return 'st-fail';
    return 'st-pend';
  }

  statusLabel(s: string): string {
    if (s === 'COMPLETED') return 'Done';
    if (s === 'FAILED')    return 'Failed';
    return 'Pending';
  }
}
