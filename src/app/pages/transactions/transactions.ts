import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { TransactionService } from '../../core/services/transaction.service';
import { TransactionResponse } from '../../core/models/transaction.model';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './transactions.html',
  styleUrl: './transactions.css'
})
export class TransactionsComponent implements OnInit {
  private auth = inject(AuthService);
  private txSvc = inject(TransactionService);

  username = '';
  email = '';
  get initials(): string { return this.username.slice(0, 2).toUpperCase() || 'U'; }

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
    return this.transactions.filter(t => {
      const typeMatch = this.filterType === 'ALL' || t.type === this.filterType;
      const statusMatch = this.filterStatus === 'ALL' || t.status === this.filterStatus;
      const searchMatch = !this.searchTerm ||
        t.transactionId.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        t.amount.toString().includes(this.searchTerm);
      return typeMatch && statusMatch && searchMatch;
    });
  }

  get totalReceived(): number {
    return this.transactions.filter(t => t.type === 'TOPUP' && t.status === 'COMPLETED').reduce((s, t) => s + t.amount, 0);
  }
  get totalSent(): number {
    return this.transactions.filter(t => (t.type === 'TRANSFER' || t.type === 'WITHDRAW') && t.status === 'COMPLETED').reduce((s, t) => s + t.amount, 0);
  }
  get pendingCount(): number { return this.transactions.filter(t => t.status === 'PENDING').length; }
  get failedCount(): number { return this.transactions.filter(t => t.status === 'FAILED').length; }

  ngOnInit(): void {
    const user = this.auth.getUser();
    this.username = user?.username ?? 'User';
    this.email = user?.email ?? '';
    this.load(0);
  }

  load(page: number): void {
    this.loading = true;
    this.error = '';
    this.txSvc.getMyTransactions(page, this.pageSize).subscribe({
      next: res => {
        this.transactions = res.content;
        this.currentPage = res.currentPage;
        this.totalPages = res.totalPages;
        this.totalElements = res.totalElements;
        this.loading = false;
      },
      error: () => { this.loading = false; this.error = 'Could not load transactions.'; }
    });
  }

  prevPage(): void { if (this.currentPage > 0) this.load(this.currentPage - 1); }
  nextPage(): void { if (this.currentPage < this.totalPages - 1) this.load(this.currentPage + 1); }

  setType(t: typeof this.filterType): void { this.filterType = t; }

  logout(): void { this.auth.logout(); }

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
    const dt = new Date(d);
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
    return tx.targetWalletId ? `Transfer → #${tx.targetWalletId}` : 'Transfer';
  }

  txIconBg(type: string): string {
    if (type === 'TOPUP') return 'rgba(16,185,129,.1)';
    if (type === 'WITHDRAW') return 'rgba(239,68,68,.08)';
    return 'rgba(108,99,255,.1)';
  }

  txIconColor(type: string): string {
    if (type === 'TOPUP') return '#10B981';
    if (type === 'WITHDRAW') return '#EF4444';
    return '#6C63FF';
  }

  txSign(type: string): string { return type === 'TOPUP' ? '+' : '-'; }
  txAmtClass(type: string): string { return type === 'TOPUP' ? 'amt-in' : 'amt-out'; }

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
