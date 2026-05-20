import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { TransactionService } from '../../core/services/transaction.service';
import {
  TransactionResponse,
  TransactionSummaryResponse,
} from '../../core/models/transaction.model';
import { SidebarComponent } from "../../shared/components/sidebar/sidebar";
import { TopbarComponent } from "../../shared/components/topbar/topbar";

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, SidebarComponent, TopbarComponent],
  templateUrl: './transactions.html',
  styleUrl: './transactions.css',
})
export class TransactionsComponent implements OnInit {
  private auth = inject(AuthService);
  private txSvc = inject(TransactionService);

  username = '';
  email = '';
  currentUserId = 0;

  get initials(): string {
    return this.username.slice(0, 2).toUpperCase() || 'U';
  }

  transactions: TransactionResponse[] = [];
  loading = true;
  error = '';

  currentPage = 0;
  totalPages = 1;
  totalElements = 0;
  pageSize = 10;

  filterType: 'ALL' | 'TOPUP' | 'TRANSFER' | 'WITHDRAW' = 'ALL';
  filterStatus: 'ALL' | 'COMPLETED' | 'PENDING' | 'FAILED' = 'ALL';
  searchTerm = '';

  get filtered(): TransactionResponse[] {
    return this.transactions.filter((t) => {
      const typeMatch = this.filterType === 'ALL' || t.type === this.filterType;
      const statusMatch = this.filterStatus === 'ALL' || t.status === this.filterStatus;
      const searchMatch =
        !this.searchTerm ||
        t.transactionId.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        t.amount.toString().includes(this.searchTerm);
      return typeMatch && statusMatch && searchMatch;
    });
  }

  // ─── Summary ────────────────────────────────────────────────────────────────
  summary: TransactionSummaryResponse | null = null;
  summaryLoading = true;
  summaryError = '';

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
    this.load(0);
    this.loadSummary();
  }

  // ─── Data loaders ───────────────────────────────────────────────────────────
  load(page: number): void {
    this.loading = true;
    this.error = '';
    this.txSvc.getMyTransactions(page, this.pageSize).subscribe({
      next: (res) => {
        this.transactions = res.content;
        this.currentPage = res.page;
        this.totalPages = res.totalPages;
        this.totalElements = res.totalElements;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.error = 'Could not load transactions.';
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
    if (this.currentPage > 0) this.load(this.currentPage - 1);
  }
  nextPage(): void {
    if (this.currentPage < this.totalPages - 1) this.load(this.currentPage + 1);
  }

  setType(t: typeof this.filterType): void {
    this.filterType = t;
    this.load(0); // reset to page 0 on filter change
  }

  setStatus(s: typeof this.filterStatus): void {
    this.filterStatus = s;
    this.load(0);
  }

  logout(): void {
    this.auth.logout();
  }

  fmt(n: number): string {
    return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  fmtShort(n: number): string {
    if (n >= 10_000_000) return '₹' + (n / 10_000_000).toFixed(1) + 'Cr';
    if (n >= 100_000) return '₹' + (n / 100_000).toFixed(1) + 'L';
    if (n >= 1_000) return '₹' + (n / 1_000).toFixed(1) + 'K';
    return '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 });
  }

  fmtDate(d: string): string {
    if (!d) return '—';
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return '—';
    const today = new Date();
    if (dt.toDateString() === today.toDateString()) {
      return 'Today, ' + dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    }
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (dt.toDateString() === yesterday.toDateString()) {
      return 'Yesterday, ' + dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    }
    return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  txLabel(tx: TransactionResponse): string {
    if (tx.type === 'TOPUP') return 'Wallet Top Up';
    if (tx.type === 'WITHDRAW') return 'Withdrawal';
    if (tx.type === 'TRANSFER' && tx.targetUserId === this.currentUserId)
      return `Transfer from Wallet #${tx.walletId}`;
    return tx.targetWalletId ? `Transfer → #${tx.targetWalletId}` : 'Transfer';
  }

  txIconBg(tx: TransactionResponse): string {
    if (tx.type === 'TOPUP') return 'rgba(16,185,129,.1)';
    if (tx.type === 'WITHDRAW') return 'rgba(239,68,68,.08)';
    if (tx.type === 'TRANSFER' && tx.targetUserId === this.currentUserId)
      return 'rgba(16,185,129,.1)';
    return 'rgba(108,99,255,.1)';
  }

  txIconColor(tx: TransactionResponse): string {
    if (tx.type === 'TOPUP') return '#10B981';
    if (tx.type === 'WITHDRAW') return '#EF4444';
    if (tx.type === 'TRANSFER' && tx.targetUserId === this.currentUserId) return '#10B981';
    return '#6C63FF';
  }

  txSign(tx: TransactionResponse): string {
    if (tx.type === 'TOPUP') return '+';
    if (tx.type === 'TRANSFER' && tx.targetUserId === this.currentUserId) return '+';
    return '-';
  }

  txAmtClass(tx: TransactionResponse): string {
    if (tx.type === 'TOPUP') return 'amt-in';
    if (tx.type === 'TRANSFER' && tx.targetUserId === this.currentUserId) return 'amt-in';
    return 'amt-out';
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
