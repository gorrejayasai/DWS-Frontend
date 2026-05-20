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

  targetUsername = '';
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

  recentContacts: string[] = [];

  private get contactsKey(): string {
    return `recent_contacts_${this.auth.getUser()?.userId}`;
  }

  ngOnInit(): void {
    const user = this.auth.getUser();
    this.username = user?.username ?? 'User';
    this.email = user?.email ?? '';
    this.loadRecentContacts();
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
    return !!this.targetUsername.trim() &&
      this.targetUsername.trim().toLowerCase() === this.username.toLowerCase();
  }

  get amtHint(): { text: string; cls: string } {
    const v = this.amountNum;
    if (!v) return { text: '', cls: '' };
    if (v < 1) return { text: 'Minimum transfer is ₹1', cls: 'err' };
    if (v > 100000) return { text: 'Maximum transfer is ₹1,00,000 per transaction', cls: 'err' };
    if (v > this.balance) return { text: 'Insufficient balance', cls: 'err' };
    return { text: `₹${v.toLocaleString('en-IN')} will be transferred`, cls: 'ok' };
  }

  get canSubmit(): boolean {
    return (
      !!this.walletId &&
      !!this.targetUsername.trim() &&
      !this.selfTransfer &&
      !!this.amount &&
      this.amountNum >= 1 &&
      this.amountNum <= 100000 &&
      this.amountNum <= this.balance &&
      !this.loading
    );
  }

  onSubmit(): void {
    if (!this.canSubmit || !this.walletId) return;
    this.loading = true;
    this.errorMsg = '';

    this.walletSvc
      .transfer(this.walletId, {
        username: this.auth.getUsername()!,
        targetUsername: this.targetUsername.trim(),
        amount: this.amountNum,
        currency: 'INR',
      })
      .subscribe({
        next: (res: any) => {
          this.saveRecentContact(this.targetUsername.trim());
          this.loading = false;
          this.successTxId = res?.transactionId ?? '';
          this.showSuccess = true;
          this.walletSvc
            .getMyWallet()
            .subscribe({ next: (w) => (this.balance = w.availableBalance), error: () => { } });
        },
        error: (err) => {
          this.loading = false;
          const body = err.error;
          if (body?.message) this.errorMsg = body.message;
          else if (typeof body === 'string') this.errorMsg = body;
          else if (err.status === 400) this.errorMsg = 'Invalid request or insufficient balance.';
          else if (err.status === 404)
            this.errorMsg = 'User not found. Please check the username and try again.';
          else this.errorMsg = 'Transfer failed. Please try again.';
        },
      });
  }

  reset(): void {
    this.amount = null;
    this.targetUsername = '';
    this.selectedQuick = null;
    this.showSuccess = false;
    this.successTxId = '';
    this.errorMsg = '';
  }

  fmt(n: number): string {
    return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  pickContact(username: string): void {
    this.targetUsername = username;
    this.errorMsg = '';
  }

  private loadRecentContacts(): void {
    this.recentContacts = JSON.parse(localStorage.getItem(this.contactsKey) ?? '[]');
  }

  private saveRecentContact(username: string): void {
    const updated = [username, ...this.recentContacts.filter(u => u !== username)].slice(0, 5);
    localStorage.setItem(this.contactsKey, JSON.stringify(updated));
    this.recentContacts = updated;
  }
}
