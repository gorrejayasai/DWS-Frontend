import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { NotificationResponse, NotificationPage, NotifItem } from '../models/notification.model';

type IconType = NotifItem['iconType'];

interface TemplateMeta {
  title: string;
  iconType: IconType;
  iconBg: string;
  iconColor: string;
  desc: string;
}

const TEMPLATE_META: Record<string, TemplateMeta> = {
  TOPUP_SUCCESS: {
    title: 'Top Up Successful',
    iconType: 'up',
    iconBg: 'rgba(16,185,129,.1)',
    iconColor: '#10B981',
    desc: 'Your wallet top up was processed successfully.',
  },
  TOPUP_FAILED: {
    title: 'Top Up Failed',
    iconType: 'up',
    iconBg: 'rgba(239,68,68,.08)',
    iconColor: '#EF4444',
    desc: 'Your top up could not be processed. Please try again.',
  },
  WITHDRAW_SUCCESS: {
    title: 'Withdrawal Processed',
    iconType: 'down',
    iconBg: 'rgba(239,68,68,.08)',
    iconColor: '#EF4444',
    desc: 'Your withdrawal has been processed successfully.',
  },
  WITHDRAW_FAILED: {
    title: 'Withdrawal Failed',
    iconType: 'down',
    iconBg: 'rgba(239,68,68,.08)',
    iconColor: '#EF4444',
    desc: 'Your withdrawal could not be processed. Please try again.',
  },
  TRANSFER_SUCCESS: {
    title: 'Transfer Successful',
    iconType: 'transfer',
    iconBg: 'rgba(108,99,255,.1)',
    iconColor: '#6C63FF',
    desc: 'Your transfer was completed successfully.',
  },
  TRANSFER_FAILED: {
    title: 'Transfer Failed',
    iconType: 'transfer',
    iconBg: 'rgba(239,68,68,.08)',
    iconColor: '#EF4444',
    desc: 'Your transfer could not be completed. Please try again.',
  },
  TRANSFER_SENT: {
    title: 'Transfer Sent',
    iconType: 'transfer',
    iconBg: 'rgba(239,68,68,.08)',
    iconColor: '#EF4444',
    desc: 'Your transfer has been sent successfully.',
  },
  TRANSFER_RECEIVED: {
    title: 'Transfer Received',
    iconType: 'transfer',
    iconBg: 'rgba(16,185,129,.1)',
    iconColor: '#10B981',
    desc: 'You have received a transfer successfully.',
  },
  kyc_submitted: {
    title: 'KYC Submitted',
    iconType: 'shield',
    iconBg: 'rgba(245,158,11,.1)',
    iconColor: '#F59E0B',
    desc: 'Your KYC documents have been received and are under review.',
  },
  kyc_updated: {
    title: 'KYC Updated',
    iconType: 'shield',
    iconBg: 'rgba(245,158,11,.1)',
    iconColor: '#F59E0B',
    desc: 'Your KYC details have been updated.',
  },
  kyc_approved: {
    title: 'KYC Approved ✓',
    iconType: 'shield',
    iconBg: 'rgba(16,185,129,.1)',
    iconColor: '#10B981',
    desc: 'Your identity has been verified. Your wallet is now fully active.',
  },
  kyc_rejected: {
    title: 'KYC Rejected',
    iconType: 'shield',
    iconBg: 'rgba(239,68,68,.08)',
    iconColor: '#EF4444',
    desc: 'Your KYC was rejected. Please resubmit with correct documents.',
  },
  LOW_BALANCE: {
    title: 'Low Balance Alert',
    iconType: 'info',
    iconBg: 'rgba(245,158,11,.1)',
    iconColor: '#F59E0B',
    desc: 'Your wallet balance is running low. Consider topping up.',
  },
  WALLET_CREATED: {
    title: 'Wallet Created',
    iconType: 'info',
    iconBg: 'rgba(108,99,255,.1)',
    iconColor: '#6C63FF',
    desc: 'Your wallet has been created successfully. You are ready to go!',
  },
  WALLET_FROZEN: {
    title: 'Wallet Frozen',
    iconType: 'shield',
    iconBg: 'rgba(239,68,68,.08)',
    iconColor: '#EF4444',
    desc: 'Your wallet has been temporarily frozen due to security or compliance reasons.',
  },
  WALLET_UNFROZEN: {
    title: 'Wallet Unfrozen',
    iconType: 'shield',
    iconBg: 'rgba(16,185,129,.1)',
    iconColor: '#10B981',
    desc: 'Your wallet has been reactivated and is now available for use.',
  },
};

const DEFAULT_META: TemplateMeta = {
  title: 'Notification',
  iconType: 'info',
  iconBg: 'rgba(108,99,255,.1)',
  iconColor: '#6C63FF',
  desc: 'You have a new notification.',
};

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private BASE = environment.apiUrl;

  getNotifications(
    page = 0,
    size = 20,
  ): Observable<{ items: NotifItem[]; totalElements: number; totalPages: number }> {
    const userId = this.auth.getUser()?.userId;
    return this.http
      .get<NotificationPage>(`${this.BASE}/notify/user/${userId}?page=${page}&size=${size}`)
      .pipe(
        map((res) => ({
          items: res.content.map((n) => this.toNotifItem(n)),
          totalElements: res.totalElements,
          totalPages: res.totalPages,
        })),
      );
  }

  private toNotifItem(n: NotificationResponse): NotifItem {
    let meta = TEMPLATE_META[n.templateCode] ?? {
      title: 'Notification',
      iconType: 'info',
      iconBg: 'rgba(108,99,255,.1)',
      iconColor: '#6C63FF',
      desc: n.templateCode,
    };
    const dt = new Date(n.createdAt);
    const time = isNaN(dt.getTime())
      ? '—'
      : dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    return {
      id: n.id,
      iconBg: meta.iconBg,
      iconColor: meta.iconColor,
      iconType: meta.iconType,
      title: meta.title,
      desc: meta.desc,
      time,
      group: this.dateGroup(dt),
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
}
