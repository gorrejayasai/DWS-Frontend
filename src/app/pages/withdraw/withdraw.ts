import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { WalletService } from '../../core/services/wallet.service';

@Component({
  selector: 'app-withdraw',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './withdraw.html',
  styleUrl: './withdraw.css'
})
export class WithdrawComponent implements OnInit {
  private auth = inject(AuthService);
  private walletSvc = inject(WalletService);

  username = '';
  email = '';
  get initials(): string { return this.username.slice(0, 2).toUpperCase() || 'U'; }

  balance = 0;
  walletLoaded = false;

  amount: number | null = null;
  get amountNum(): number { return this.amount ?? 0; }

  loading = false;
  showSuccess = false;
  errorMsg = '';
  successTxId = '';
  selectedQuick: number | null = null;

  quickAmounts = [500, 1000, 2000, 5000, 10000, 25000];

  ngOnInit(): void {
    const user = this.auth.getUser();
    this.username = user?.username ?? 'User';
    this.email = user?.email ?? '';
    this.walletSvc.getMyWallet().subscribe({
      next: w => { this.balance = w.availableBalance; this.walletLoaded = true; },
      error: () => { this.walletLoaded = true; }
    });
  }

  selectQuick(amt: number): void {
    this.amount = amt;
    this.selectedQuick = amt;
    this.errorMsg = '';
  }

  onAmountChange(): void { this.selectedQuick = null; this.errorMsg = ''; }

  get amtHint(): { text: string; cls: string } {
    const v = this.amountNum;
    if (!v) return { text: '', cls: '' };
    if (v < 1) return { text: 'Minimum withdrawal is ₹1', cls: 'err' };
    if (v > 50000) return { text: 'Maximum withdrawal is ₹50,000 per transaction', cls: 'err' };
    if (v > this.balance) return { text: 'Insufficient balance', cls: 'err' };
    return { text: `₹${v.toLocaleString('en-IN')} will be withdrawn from your wallet`, cls: 'ok' };
  }

  get canSubmit(): boolean {
    return !!this.amount && this.amountNum >= 1 && this.amountNum <= 50000 &&
      this.amountNum <= this.balance && !this.loading;
  }

  onSubmit(): void {
    if (!this.canSubmit) return;
    this.loading = true;
    this.errorMsg = '';
    const key = crypto.randomUUID();
    this.walletSvc.withdraw({ amount: this.amountNum, currency: 'INR', idempotencyKey: key }).subscribe({
      next: (res: any) => {
        this.loading = false;
        this.successTxId = res?.transactionId ?? key;
        this.showSuccess = true;
        this.balance -= this.amountNum;
      },
      error: (err) => {
        this.loading = false;
        const body = err.error;
        if (typeof body === 'string') this.errorMsg = body;
        else if (body?.message) this.errorMsg = body.message;
        else if (err.status === 400) this.errorMsg = 'Invalid amount or insufficient balance.';
        else this.errorMsg = 'Withdrawal failed. Please try again.';
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
