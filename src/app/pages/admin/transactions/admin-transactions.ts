import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { AdminService } from '../../../core/services/admin.service';
import { TransactionService } from '../../../core/services/transaction.service';

@Component({
  selector: 'app-admin-transactions',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin-transactions.html',
  styleUrl: './admin-transactions.css'
})
export class AdminTransactionsComponent implements OnInit {
  private auth     = inject(AuthService);
  private adminSvc = inject(AdminService);
  private txSvc    = inject(TransactionService);

  username = '';
  get initials(): string { return this.username.slice(0, 2).toUpperCase() || 'A'; }

  sidebarExpanded = false;

  transactions:  any[] = [];
  totalElements  = 0;
  totalPages     = 0;
  currentPage    = 0;
  pageSize       = 10;
  listLoading    = false;
  listError      = '';

  // KYC-based stats
  kycList:       any[] = [];
  pendingKyc     = 0;
  approvedKyc    = 0;

  filterType   = 'ALL';
  filterStatus = 'ALL';
  searchTerm   = '';

  ngOnInit(): void {
    const user   = this.auth.getUser();
    this.username = user?.username ?? 'Admin';
    this.loadKycStats();
    this.loadTransactions();
  }

  /* ── Load KYC stats for summary row ─────────────────────────────────── */
  loadKycStats(): void {
    this.adminSvc.getAllKyc().subscribe({
      next: (res: any[]) => {
        this.kycList    = res ?? [];
        this.pendingKyc  = this.kycList.filter(k => k.status === 'PENDING').length;
        this.approvedKyc = this.kycList.filter(k => k.status === 'APPROVED').length;
      },
      error: () => {}
    });
  }

  /* ── Load transactions via /transactions/me ──────────────────────────── */
  loadTransactions(): void {
    this.listLoading = true;
    this.listError   = '';
    this.txSvc.getMyTransactions(this.currentPage, this.pageSize).subscribe({
      next: (res: any) => {
        this.transactions  = res.content ?? [];
        this.totalElements = res.totalElements ?? 0;
        this.totalPages    = res.totalPages   ?? 1;
        this.currentPage   = res.number       ?? res.currentPage ?? 0;
        this.listLoading   = false;
      },
      error: (err: any) => {
        const status = err?.status;
        if (status === 404 || status === 400)
          this.listError = 'No wallet found for admin account — transactions require an active wallet.';
        else if (status === 0)
          this.listError = 'Cannot reach server — is the backend running?';
        else
          this.listError = `Failed to load transactions (HTTP ${status ?? 'unknown'}).`;
        this.listLoading = false;
      }
    });
  }

  get filtered(): any[] {
    return this.transactions.filter(tx => {
      const typeMatch   = this.filterType   === 'ALL' || tx.type   === this.filterType;
      const statusMatch = this.filterStatus === 'ALL' || tx.status === this.filterStatus;
      const term        = this.searchTerm.toLowerCase();
      const searchMatch = !term ||
        tx.transactionId?.toLowerCase().includes(term) ||
        String(tx.id ?? '').includes(term) ||
        String(tx.walletId ?? '').includes(term) ||
        String(tx.amount ?? '').includes(term);
      return typeMatch && statusMatch && searchMatch;
    });
  }

  get totalVolume(): number {
    return this.transactions
      .filter(tx => tx.status === 'COMPLETED')
      .reduce((sum, tx) => sum + (tx.amount || 0), 0);
  }

  get pendingTxCount(): number { return this.transactions.filter(tx => tx.status === 'PENDING').length;  }
  get failedTxCount():  number { return this.transactions.filter(tx => tx.status === 'FAILED').length;   }

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
    if (!d) return '—';
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return '—';
    return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  fmtAmt(n: number, type: string): string {
    const sign = type === 'TOPUP' ? '+' : '-';
    return sign + '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  fmtVol(n: number): string {
    return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  shortId(id: string | number): string {
    const s = String(id ?? '');
    return s.length > 8 ? '…' + s.slice(-6) : s;
  }

  amtClass(type: string):    string { return type === 'TOPUP' ? 'amt-in' : 'amt-out'; }

  statusClass(s: string): string {
    if (s === 'COMPLETED') return 'st-done';
    if (s === 'FAILED')    return 'st-fail';
    return 'st-pend';
  }

  typeClass(t: string): string {
    if (t === 'TOPUP')    return 'type-topup';
    if (t === 'TRANSFER') return 'type-transfer';
    if (t === 'WITHDRAW') return 'type-withdraw';
    return 'type-other';
  }
}
