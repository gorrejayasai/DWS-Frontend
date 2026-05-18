import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { WalletService } from '../../core/services/wallet.service';
import { SidebarComponent } from "../../shared/components/sidebar/sidebar";
import { TopbarComponent } from "../../shared/components/topbar/topbar";

@Component({
  selector: 'app-transfer',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, SidebarComponent, TopbarComponent],
  templateUrl: './transfer.html',
  styleUrl: './transfer.css',
})
export class TransferComponent implements OnInit {
  private auth = inject(AuthService);
  private walletSvc = inject(WalletService);

  username = '';
  email = '';
  get initials(): string {
    return this.username.slice(0, 2).toUpperCase() || 'U';
  }

  walletId: number | null = null;
  balance = 0;
  walletLoaded = false;

  targetWalletId: number | null = null;
  amount: number | null = null;
  get amountNum(): number {
    return this.amount ?? 0;
  }

  loading = false;
  showSuccess = false;
  errorMsg = '';
  successTxId = '';
  selectedQuick: number | null = null;

  quickAmounts = [500, 1000, 5000, 10000, 25000];

  ngOnInit(): void {
    const user = this.auth.getUser();
    this.username = user?.username ?? 'User';
    this.email = user?.email ?? '';
    this.walletSvc.getMyWallet().subscribe({
      next: (w) => {
        this.walletId = w.id;
        this.balance = w.availableBalance;
        this.walletLoaded = true;
      },
      error: () => {
        this.walletLoaded = true;
      },
    });
  }

  selectQuick(amt: number): void {
    this.amount = amt;
    this.selectedQuick = amt;
    this.errorMsg = '';
  }
  onAmountChange(): void {
    this.selectedQuick = null;
    this.errorMsg = '';
  }

  get selfTransfer(): boolean {
    return !!this.targetWalletId && this.targetWalletId === this.walletId;
  }

  get amtHint(): { text: string; cls: string } {
    const v = this.amountNum;
    if (!v) return { text: '', cls: '' };
    if (v < 1) return { text: 'Minimum transfer is ₹1', cls: 'err' };
    if (v > 100000) return { text: 'Maximum transfer is ₹1,00,000 per transaction', cls: 'err' };
    if (v > this.balance) return { text: 'Insufficient balance', cls: 'err' };
    return { text: `₹${v.toLocaleString('en-IN')} will be transferred`, cls: 'ok' };
  }

  get targetHint(): string {
    if (this.selfTransfer) return 'Cannot transfer to your own wallet';
    return '';
  }

  get canSubmit(): boolean {
    return (
      !!this.walletId &&
      !!this.targetWalletId &&
      !this.selfTransfer &&
      !!this.amount &&
      this.amountNum >= 1 &&
      this.amountNum <= 100000 &&
      this.amountNum <= this.balance &&
      !this.loading
    );
  }

  onSubmit(): void {
    if (!this.canSubmit || !this.walletId || !this.targetWalletId) return;
    this.loading = true;
    this.errorMsg = '';

    this.walletSvc
      .transfer(this.walletId, {
        targetWalletId: this.targetWalletId,
        amount: this.amountNum,
        currency: 'INR',
      })
      .subscribe({
        next: (res: any) => {
          this.loading = false;
          this.successTxId = res?.transactionId ?? '';
          this.showSuccess = true;
          this.walletSvc
            .getMyWallet()
            .subscribe({ next: (w) => (this.balance = w.availableBalance), error: () => {} });
        },
        error: (err) => {
          this.loading = false;
          const body = err.error;
          if (body?.message) this.errorMsg = body.message;
          else if (typeof body === 'string') this.errorMsg = body;
          else if (err.status === 400) this.errorMsg = 'Invalid request or insufficient balance.';
          else if (err.status === 404)
            this.errorMsg = 'Wallet ID not found. Please check and try again.';
          else this.errorMsg = 'Transfer failed. Please try again.';
        },
      });
  }

  reset(): void {
    this.amount = null;
    this.targetWalletId = null;
    this.selectedQuick = null;
    this.showSuccess = false;
    this.successTxId = '';
    this.errorMsg = '';
  }

  fmt(n: number): string {
    return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}
