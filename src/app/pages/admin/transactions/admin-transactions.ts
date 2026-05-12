import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { AdminService } from '../../../core/services/admin.service';

@Component({
  selector: 'app-admin-transactions',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin-transactions.html',
  styleUrl: './admin-transactions.css'
})
export class AdminTransactionsComponent implements OnInit {
  private auth = inject(AuthService);
  private adminSvc = inject(AdminService);

  username = '';
  get initials(): string { return this.username.slice(0, 2).toUpperCase() || 'A'; }

  sidebarExpanded = false;

  transactions: any[] = [];
  totalElements = 0;
  totalPages = 0;
  currentPage = 0;
  pageSize = 10;

  filterType = 'ALL';
  filterStatus = 'ALL';
  searchTerm = '';

  ngOnInit(): void {
    const user = this.auth.getUser();
    this.username = user?.username ?? 'Admin';
    this.loadTransactions();
  }

  loadTransactions(): void {
    this.adminSvc.getAllTransactions(this.currentPage, this.pageSize).subscribe({
      next: res => {
        this.transactions = res.content;
        this.totalElements = res.totalElements;
        this.totalPages = res.totalPages;
      },
      error: () => {}
    });
  }

  get filtered(): any[] {
    return this.transactions.filter(tx => {
      const typeMatch = this.filterType === 'ALL' || tx.type === this.filterType;
      const statusMatch = this.filterStatus === 'ALL' || tx.status === this.filterStatus;
      const term = this.searchTerm.toLowerCase();
      const searchMatch = !term ||
        tx.id?.toString().includes(term) ||
        tx.walletId?.toString().includes(term);
      return typeMatch && statusMatch && searchMatch;
    });
  }

  get totalVolume(): number {
    return this.transactions
      .filter(tx => tx.status === 'COMPLETED')
      .reduce((sum, tx) => sum + (tx.amount || 0), 0);
  }

  get pendingCount(): number { return this.transactions.filter(tx => tx.status === 'PENDING').length; }
  get failedCount(): number { return this.transactions.filter(tx => tx.status === 'FAILED').length; }

  setTypeFilter(t: string): void { this.filterType = t; }

  prevPage(): void {
    if (this.currentPage > 0) { this.currentPage--; this.loadTransactions(); }
  }
  nextPage(): void {
    if (this.currentPage < this.totalPages - 1) { this.currentPage++; this.loadTransactions(); }
  }

  toggleSidebar(): void { this.sidebarExpanded = !this.sidebarExpanded; }
  logout(): void { this.auth.logout(); }

  fmtDate(d: string): string {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  fmtAmt(n: number, type: string): string {
    const sign = type === 'TOPUP' ? '+' : '-';
    return sign + '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  fmtVol(n: number): string {
    return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  shortId(id: string | number): string {
    const s = String(id);
    return s.length > 8 ? '…' + s.slice(-6) : s;
  }

  amtClass(type: string): string { return type === 'TOPUP' ? 'amt-in' : 'amt-out'; }

  statusClass(s: string): string {
    if (s === 'COMPLETED') return 'st-done';
    if (s === 'FAILED') return 'st-fail';
    return 'st-pend';
  }

  typeClass(t: string): string {
    if (t === 'TOPUP') return 'type-topup';
    if (t === 'TRANSFER') return 'type-transfer';
    if (t === 'WITHDRAW') return 'type-withdraw';
    return 'type-other';
  }
}
