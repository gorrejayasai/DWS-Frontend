import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../../core/services/auth.service';
import { TransactionService } from '../../core/services/transaction.service';
import { KycService } from '../../core/services/kyc.service';
import { TransactionResponse } from '../../core/models/transaction.model';
import { KycResponse } from '../../core/models/kyc.model';

export interface NotifItem {
  id: number;
  iconBg: string;
  iconColor: string;
  iconType: 'up' | 'down' | 'transfer' | 'info' | 'shield';
  title: string;
  desc: string;
  time: string;
  amt?: string;
  amtClass?: string;
  group: string;
}

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './notifications.html',
  styleUrl: './notifications.css'
})
export class NotificationsComponent implements OnInit {
  private auth = inject(AuthService);
  private txSvc = inject(TransactionService);
  private kycSvc = inject(KycService);

  username = '';
  email = '';
  get initials(): string { return this.username.slice(0, 2).toUpperCase() || 'U'; }

  notifs: NotifItem[] = [];
  loading = true;
  activeFilter: 'all' | 'transactions' | 'system' = 'all';

  get filtered(): NotifItem[] {
    if (this.activeFilter === 'all') return this.notifs;
    if (this.activeFilter === 'transactions')
      return this.notifs.filter(n => n.iconType === 'up' || n.iconType === 'down' || n.iconType === 'transfer');
    return this.notifs.filter(n => n.iconType === 'info' || n.iconType === 'shield');
  }

  get groupedNotifs(): { label: string; items: NotifItem[] }[] {
    const groups: Record<string, NotifItem[]> = {};
    for (const n of this.filtered) {
      if (!groups[n.group]) groups[n.group] = [];
      groups[n.group].push(n);
    }
    const order = ['Today', 'Yesterday', 'Earlier'];
    return order.filter(k => groups[k]).map(k => ({ label: k, items: groups[k] }));
  }

  ngOnInit(): void {
    const user = this.auth.getUser();
    this.username = user?.username ?? 'User';
    this.email = user?.email ?? '';
    this.loadNotifs(user?.userId);
  }

  loadNotifs(userId?: number): void {
    const txs$ = this.txSvc.getMyTransactions(0, 20).pipe(catchError(() => of(null)));
    const kyc$ = userId
      ? this.kycSvc.getKycByUserId(userId).pipe(catchError(() => of(null)))
      : of(null);

    forkJoin({ txs: txs$, kyc: kyc$ }).subscribe(({ txs, kyc }) => {
      const items: NotifItem[] = [];

      // KYC notifications — show based on status
      if (kyc) {
        items.push(this.kycToNotif(kyc));
      }

      // Transaction notifications
      if (txs?.content) {
        items.push(...txs.content.map(tx => this.txToNotif(tx)));
      }

      // Sort all by time descending (most recent first)
      this.notifs = items;
      this.loading = false;
    });
  }

  private kycToNotif(kyc: KycResponse): NotifItem {
    const rawDate = kyc.reviewedAt ?? kyc.submittedAt;
    const dt = rawDate ? new Date(rawDate) : new Date();
    const group = this.dateGroup(dt);
    const timeStr = isNaN(dt.getTime())
      ? '—'
      : dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    if (kyc.status === 'APPROVED') {
      return {
        id: kyc.id,
        iconBg: 'rgba(16,185,129,.1)', iconColor: '#10B981', iconType: 'shield',
        title: 'KYC Approved ✓',
        desc: 'Your identity has been verified. Your wallet is now active.',
        time: timeStr, group
      };
    }
    if (kyc.status === 'REJECTED') {
      return {
        id: kyc.id,
        iconBg: 'rgba(239,68,68,.08)', iconColor: '#EF4444', iconType: 'shield',
        title: 'KYC Rejected',
        desc: kyc.reviewRemarks ?? 'Your KYC was rejected. Please resubmit with correct documents.',
        time: timeStr, group
      };
    }
    // PENDING
    return {
      id: kyc.id,
      iconBg: 'rgba(245,158,11,.1)', iconColor: '#F59E0B', iconType: 'info',
      title: 'KYC Under Review',
      desc: 'Your identity documents are being reviewed. This usually takes 1–2 business days.',
      time: timeStr, group
    };
  }

  private txToNotif(tx: TransactionResponse): NotifItem {
    const dt = tx.createdAt ? new Date(tx.createdAt) : new Date();
    const group = this.dateGroup(dt);
    const timeStr = isNaN(dt.getTime())
      ? '—'
      : dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    if (tx.type === 'TOPUP') {
      return {
        id: tx.id, group,
        iconBg: 'rgba(16,185,129,.1)', iconColor: '#10B981', iconType: 'up',
        title: 'Top Up Successful',
        desc: `₹${tx.amount.toLocaleString('en-IN')} was added to your wallet.`,
        time: timeStr,
        amt: `+₹${tx.amount.toLocaleString('en-IN')}`, amtClass: 'amt-pos'
      };
    }
    if (tx.type === 'WITHDRAW') {
      return {
        id: tx.id, group,
        iconBg: 'rgba(239,68,68,.08)', iconColor: '#EF4444', iconType: 'down',
        title: 'Withdrawal Processed',
        desc: `₹${tx.amount.toLocaleString('en-IN')} was withdrawn from your wallet.`,
        time: timeStr,
        amt: `-₹${tx.amount.toLocaleString('en-IN')}`, amtClass: 'amt-neg'
      };
    }
    return {
      id: tx.id, group,
      iconBg: 'rgba(108,99,255,.1)', iconColor: '#6C63FF', iconType: 'transfer',
      title: tx.targetWalletId ? `Transfer to Wallet #${tx.targetWalletId}` : 'Transfer Sent',
      desc: `₹${tx.amount.toLocaleString('en-IN')} was transferred.`,
      time: timeStr,
      amt: `-₹${tx.amount.toLocaleString('en-IN')}`, amtClass: 'amt-neg'
    };
  }

  private dateGroup(dt: Date): string {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (dt.toDateString() === today.toDateString()) return 'Today';
    if (dt.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return 'Earlier';
  }

  setFilter(f: typeof this.activeFilter): void { this.activeFilter = f; }
  logout(): void { this.auth.logout(); }
}
