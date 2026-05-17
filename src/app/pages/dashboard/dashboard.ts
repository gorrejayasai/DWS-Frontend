import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { WalletService } from '../../core/services/wallet.service';
import { TransactionService } from '../../core/services/transaction.service';
import { WalletResponse } from '../../core/models/wallet.model';
import { TransactionResponse, TransactionSummaryResponse } from '../../core/models/transaction.model';
import { SidebarComponent } from "../../shared/components/sidebar/sidebar";
import { TopbarComponent } from '../../shared/components/topbar/topbar';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, SidebarComponent, TopbarComponent],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class DashboardComponent implements OnInit {
  private auth = inject(AuthService);
  private walletSvc = inject(WalletService);
  private txSvc = inject(TransactionService);

  // ─── User info ─────────────────────────────────────────────────────────────
  username = '';
  email = '';
  currentUserId = 0;

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
  walletError = '';

  // ─── Transactions ───────────────────────────────────────────────────────────
  transactions: TransactionResponse[] = [];
  txLoading = true;
  txError = '';
  currentPage = 0;
  totalPages = 1;
  totalElements = 0;
  pageSize = 5;

  // ─── Summary ────────────────────────────────────────────────────────────────
  summary: TransactionSummaryResponse | null = null;
  summaryLoading = true;
  summaryError = '';

  // ─── Computed stats ─────────────────────────────────────────────────────────
  get totalReceived(): number {
    if (!this.summary) return 0;
    return (
      (this.summary.topup?.totalAmount ?? 0) + (this.summary.transfersReceived?.totalAmount ?? 0)
    );
  }

  get totalSent(): number {
    if (!this.summary) return 0;
    return (
      (this.summary.withdraw?.totalAmount ?? 0) + (this.summary.transfersSent?.totalAmount ?? 0)
    );
  }

  get totalTransactions(): number {
    return this.summary?.overall?.totalTransactions ?? 0;
  }

  get netFlow(): number {
    return this.summary?.overall?.netFlow ?? 0;
  }

  // ─── Lifecycle ──────────────────────────────────────────────────────────────
  ngOnInit(): void {
    const user = this.auth.getUser();
    this.username = user?.username ?? 'User';
    this.email = user?.email ?? '';
    this.currentUserId = user?.userId ?? 0;
    this.loadWallet();
    this.loadTransactions(0);
    this.loadSummary();
  }

  // ─── Data loaders ───────────────────────────────────────────────────────────
  loadWallet(): void {
    this.walletLoading = true;
    this.walletError = '';
    this.walletSvc.getMyWallet().subscribe({
      next: (w) => {
        this.wallet = w;
        this.walletLoading = false;
      },
      error: (err) => {
        this.walletLoading = false;
        this.walletError = err.status === 404 ? 'no-wallet' : 'Could not load wallet.';
      },
    });
  }

  loadTransactions(page: number): void {
    this.txLoading = true;
    this.txError = '';
    this.txSvc.getMyTransactions(page, this.pageSize).subscribe({
      next: (res) => {
        this.transactions = res.content;
        this.currentPage = res.page;
        this.totalPages = res.totalPages;
        this.totalElements = res.totalElements;
        this.txLoading = false;
      },
      error: () => {
        this.txLoading = false;
        this.txError = 'Could not load transactions.';
      },
    });
  }

  loadSummary(): void {
    this.summaryLoading = true;
    this.summaryError = '';
    this.txSvc.getTransactionSummary().subscribe({
      next: (s) => {
        this.summary = s;
        this.summaryLoading = false;
      },
      error: () => {
        this.summaryLoading = false;
        this.summaryError = 'Could not load summary.';
      },
    });
  }

  prevPage(): void {
    if (this.currentPage > 0) this.loadTransactions(this.currentPage - 1);
  }
  nextPage(): void {
    if (this.currentPage < this.totalPages - 1) this.loadTransactions(this.currentPage + 1);
  }

  logout(): void {
    this.auth.logout();
  }

  // ─── Display helpers ────────────────────────────────────────────────────────
  formatAmount(n: number): string {
    return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  formatAmountShort(n: number): string {
    if (n >= 10_000_000) return '₹' + (n / 10_000_000).toFixed(1) + 'Cr';
    if (n >= 100_000) return '₹' + (n / 100_000).toFixed(1) + 'L';
    if (n >= 1_000) return '₹' + (n / 1_000).toFixed(1) + 'K';
    return '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 });
  }

  formatDate(d: string): string {
    if (!d) return '—';
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return '—';
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
    return (
      dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) +
      ', ' +
      dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    );
  }

  txIconClass(tx: TransactionResponse): string {
    if (tx.type === 'TOPUP') return 'ti-in';
    if (tx.type === 'WITHDRAW') return 'ti-out';
    if (tx.type === 'TRANSFER' && tx.targetUserId === this.currentUserId) return 'ti-in';
    return 'ti-transfer';
  }

  txLabel(tx: TransactionResponse): string {
    if (tx.type === 'TOPUP') return 'Wallet Top Up';
    if (tx.type === 'WITHDRAW') return 'Withdrawal';
    if (tx.type === 'TRANSFER' && tx.targetUserId === this.currentUserId)
      return `Transfer from Wallet #${tx.walletId}`;
    return tx.targetWalletId ? `Transfer to Wallet #${tx.targetWalletId}` : 'Transfer';
  }

  txAmtClass(tx: TransactionResponse): string {
    if (tx.type === 'TOPUP') return 'amt-in';
    if (tx.type === 'TRANSFER' && tx.targetUserId === this.currentUserId) return 'amt-in';
    return 'amt-out';
  }

  txSign(tx: TransactionResponse): string {
    if (tx.type === 'TOPUP') return '+';
    if (tx.type === 'TRANSFER' && tx.targetUserId === this.currentUserId) return '+';
    return '-';
  }

  statusClass(s: string): string {
    if (s === 'COMPLETED') return 'st-done';
    if (s === 'FAILED') return 'st-fail';
    return 'st-pend';
  }

  statusLabel(s: string): string {
    if (s === 'COMPLETED') return 'Done';
    if (s === 'FAILED') return 'Failed';
    return 'Pending';
  }
}
