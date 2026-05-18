import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { WalletService } from '../../core/services/wallet.service';
import { TransactionService } from '../../core/services/transaction.service';
import { WalletResponse } from '../../core/models/wallet.model';
import { TransactionSummaryResponse } from '../../core/models/transaction.model';
import { SidebarComponent } from "../../shared/components/sidebar/sidebar";
import { TopbarComponent } from "../../shared/components/topbar/topbar";

@Component({
  selector: 'app-wallet',
  standalone: true,
  imports: [CommonModule, RouterLink, SidebarComponent, TopbarComponent],
  templateUrl: './wallet.html',
  styleUrl: './wallet.css',
})
export class WalletComponent implements OnInit {
  private auth = inject(AuthService);
  private walletSvc = inject(WalletService);
  private txSvc = inject(TransactionService);

  username = '';
  email = '';
  get initials(): string {
    return this.username.slice(0, 2).toUpperCase() || 'U';
  }

  wallet: WalletResponse | null = null;
  walletLoading = true;
  walletError = '';

  summary: TransactionSummaryResponse | null = null;
  summaryLoading = true;

  get totalIn(): number {
    if (!this.summary) return 0;
    return (
      (this.summary.topup?.totalAmount ?? 0) + (this.summary.transfersReceived?.totalAmount ?? 0)
    );
  }

  get totalOut(): number {
    if (!this.summary) return 0;
    return (
      (this.summary.withdraw?.totalAmount ?? 0) + (this.summary.transfersSent?.totalAmount ?? 0)
    );
  }

  get txCount(): number {
    return this.summary?.overall?.totalTransactions ?? 0;
  }

  ngOnInit(): void {
    const user = this.auth.getUser();
    this.username = user?.username ?? 'User';
    this.email = user?.email ?? '';
    this.loadWallet();
    this.loadSummary();
  }

  loadWallet(): void {
    this.walletSvc.getMyWallet().subscribe({
      next: (w) => {
        this.wallet = w;
        this.walletLoading = false;
      },
      error: () => {
        this.walletLoading = false;
        this.walletError = 'Could not load wallet.';
      },
    });
  }

  loadSummary(): void {
    this.txSvc.getTransactionSummary().subscribe({
      next: (s) => {
        this.summary = s;
        this.summaryLoading = false;
      },
      error: () => {
        this.summaryLoading = false;
      },
    });
  }

  logout(): void {
    this.auth.logout();
  }

  fmt(n: number): string {
    return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  fmtDate(d: string): string {
    if (!d) return '—';
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return '—';
    return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  get memberSince(): string {
    if (!this.wallet?.createdAt) return '—';
    const d = new Date(this.wallet.createdAt);
    return d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
  }

  get statusClass(): string {
    if (this.wallet?.status === 'ACTIVE') return 'tag-active';
    if (this.wallet?.status === 'FROZEN') return 'tag-frozen';
    return 'tag-closed';
  }
}
