import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { TransactionService } from '../../core/services/transaction.service';
import { TransactionResponse } from '../../core/models/transaction.model';

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

  username = '';
  email = '';
  get initials(): string { return this.username.slice(0, 2).toUpperCase() || 'U'; }

  notifs: NotifItem[] = [];
  loading = true;
  activeFilter: 'all' | 'transactions' | 'system' = 'all';

  get filtered(): NotifItem[] {
    if (this.activeFilter === 'all') return this.notifs;
    if (this.activeFilter === 'transactions') return this.notifs.filter(n => n.iconType === 'up' || n.iconType === 'down' || n.iconType === 'transfer');
    return this.notifs.filter(n => n.iconType === 'info' || n.iconType === 'shield');
  }

  get groupedNotifs(): { label: string; items: NotifItem[] }[] {
    const groups: Record<string, NotifItem[]> = {};
    for (const n of this.filtered) {
      if (!groups[n.group]) groups[n.group] = [];
      groups[n.group].push(n);
    }
    // Order: Today, Yesterday, Earlier
    const order = ['Today', 'Yesterday', 'Earlier'];
    return order.filter(k => groups[k]).map(k => ({ label: k, items: groups[k] }));
  }

  ngOnInit(): void {
    const user = this.auth.getUser();
    this.username = user?.username ?? 'User';
    this.email = user?.email ?? '';
    this.loadNotifs();
  }

  loadNotifs(): void {
    this.txSvc.getMyTransactions(0, 20).subscribe({
      next: res => {
        this.notifs = res.content.map(tx => this.txToNotif(tx));
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  private txToNotif(tx: TransactionResponse): NotifItem {
    const dt = new Date(tx.createdAt);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    let group = 'Earlier';
    if (dt.toDateString() === today.toDateString()) group = 'Today';
    else if (dt.toDateString() === yesterday.toDateString()) group = 'Yesterday';

    const timeStr = dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    if (tx.type === 'TOPUP') {
      return {
        id: tx.id, group,
        iconBg: 'rgba(16,185,129,.1)', iconColor: '#10B981', iconType: 'up',
        title: 'Top Up Received',
        desc: `Your wallet was topped up with ₹${tx.amount.toLocaleString('en-IN')}.`,
        time: timeStr,
        amt: `+₹${tx.amount.toLocaleString('en-IN')}`, amtClass: 'amt-pos'
      };
    }
    if (tx.type === 'WITHDRAW') {
      return {
        id: tx.id, group,
        iconBg: 'rgba(239,68,68,.08)', iconColor: '#EF4444', iconType: 'down',
        title: 'Withdrawal',
        desc: `You withdrew ₹${tx.amount.toLocaleString('en-IN')} from your wallet.`,
        time: timeStr,
        amt: `-₹${tx.amount.toLocaleString('en-IN')}`, amtClass: 'amt-neg'
      };
    }
    return {
      id: tx.id, group,
      iconBg: 'rgba(108,99,255,.1)', iconColor: '#6C63FF', iconType: 'transfer',
      title: tx.targetWalletId ? `Transfer to Wallet #${tx.targetWalletId}` : 'Transfer',
      desc: `You transferred ₹${tx.amount.toLocaleString('en-IN')}.`,
      time: timeStr,
      amt: `-₹${tx.amount.toLocaleString('en-IN')}`, amtClass: 'amt-neg'
    };
  }

  setFilter(f: typeof this.activeFilter): void { this.activeFilter = f; }
  logout(): void { this.auth.logout(); }
}
