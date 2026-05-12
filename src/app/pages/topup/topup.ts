import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { WalletService } from '../../core/services/wallet.service';

@Component({
  selector: 'app-topup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './topup.html',
  styleUrl: './topup.css'
})
export class TopupComponent implements OnInit {
  private auth = inject(AuthService);
  private walletSvc = inject(WalletService);

  username = '';
  email = '';
  get initials(): string { return this.username.slice(0, 2).toUpperCase() || 'U'; }

  walletId: number | null = null;
  balance = 0;
  walletLoaded = false;

  amount: number | null = null;
  get amountNum(): number { return this.amount ?? 0; }

  loading = false;
  showSuccess = false;
  errorMsg = '';
  successTxId = '';
  selectedQuick: number | null = null;

  quickAmounts = [500, 1000, 5000, 10000, 25000, 50000];

  ngOnInit(): void {
    const user = this.auth.getUser();
    this.username = user?.username ?? 'User';
    this.email = user?.email ?? '';
    this.walletSvc.getMyWallet().subscribe({
      next: w => {
        this.walletId = w.id;
        this.balance = w.availableBalance;
        this.walletLoaded = true;
      },
      error: () => { this.walletLoaded = true; }
    });
  }

  selectQuick(amt: number): void { this.amount = amt; this.selectedQuick = amt; this.errorMsg = ''; }
  onAmountChange(): void { this.selectedQuick = null; this.errorMsg = ''; }

  get amtHint(): { text: string; cls: string } {
    const v = this.amountNum;
    if (!v) return { text: '', cls: '' };
    if (v < 1)     return { text: 'Minimum top-up is ₹1', cls: 'err' };
    if (v > 50000) return { text: 'Maximum top-up is ₹50,000 per transaction', cls: 'err' };
    return { text: `You will add ₹${v.toLocaleString('en-IN')} to your wallet`, cls: 'ok' };
  }

  get canSubmit(): boolean {
    return !!this.walletId && !!this.amount && this.amountNum >= 1 && this.amountNum <= 50000 && !this.loading;
  }

  onSubmit(): void {
    if (!this.canSubmit || !this.walletId) return;
    this.loading = true;
    this.errorMsg = '';

    this.walletSvc.topUp(this.walletId, { amount: this.amountNum, currency: 'INR' }).subscribe({
      next: (res: any) => {
        this.loading = false;
        this.successTxId = res?.transactionId ?? '';
        this.showSuccess = true;
        // Reload balance from server instead of a local optimistic update
        this.walletSvc.getMyWallet().subscribe({ next: w => this.balance = w.availableBalance, error: () => {} });
      },
      error: (err) => {
        this.loading = false;
        const body = err.error;
        if (body?.message)            this.errorMsg = body.message;
        else if (typeof body === 'string') this.errorMsg = body;
        else if (err.status === 400)  this.errorMsg = 'Invalid amount or wallet not active.';
        else if (err.status === 404)  this.errorMsg = 'Wallet not found. Please complete KYC.';
        else                          this.errorMsg = 'Top-up failed. Please try again.';
      }
    });
  }

  reset(): void {
    this.amount = null;
    this.selectedQuick = null;
    this.showSuccess = false;
    this.successTxId = '';
    this.errorMsg = '';
  }

  fmt(n: number): string {
    return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}
