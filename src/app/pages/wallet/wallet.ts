import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { WalletService } from '../../core/services/wallet.service';
import { TransactionService } from '../../core/services/transaction.service';
import { WalletResponse } from '../../core/models/wallet.model';

@Component({
  selector: 'app-wallet',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './wallet.html',
  styleUrl: './wallet.css'
})
export class WalletComponent implements OnInit {
  private auth = inject(AuthService);
  private walletSvc = inject(WalletService);
  private txSvc = inject(TransactionService);

  username = '';
  email = '';
  get initials(): string { return this.username.slice(0, 2).toUpperCase() || 'U'; }

  wallet: WalletResponse | null = null;
  walletLoading = true;
  walletError = '';

  totalIn = 0;
  totalOut = 0;
  txCount = 0;

  ngOnInit(): void {
    const user = this.auth.getUser();
    this.username = user?.username ?? 'User';
    this.email = user?.email ?? '';
    this.loadWallet();
    this.loadStats();
  }

  loadWallet(): void {
    this.walletSvc.getMyWallet().subscribe({
      next: w => { this.wallet = w; this.walletLoading = false; },
      error: () => { this.walletLoading = false; this.walletError = 'Could not load wallet.'; }
    });
  }

  loadStats(): void {
    this.txSvc.getMyTransactions(0, 100).subscribe({
      next: res => {
        this.txCount = res.totalElements;
        this.totalIn = res.content
          .filter(t => t.type === 'TOPUP' && t.status === 'COMPLETED')
          .reduce((s, t) => s + t.amount, 0);
        this.totalOut = res.content
          .filter(t => (t.type === 'TRANSFER' || t.type === 'WITHDRAW') && t.status === 'COMPLETED')
          .reduce((s, t) => s + t.amount, 0);
      },
      error: () => {}
    });
  }

  logout(): void { this.auth.logout(); }

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
