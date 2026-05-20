import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { NotifItem } from '../../core/models/notification.model';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar';
import { TopbarComponent } from '../../shared/components/topbar/topbar';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, SidebarComponent, TopbarComponent],
  templateUrl: './notifications.html',
  styleUrl: './notifications.css',
})
export class NotificationsComponent implements OnInit {
  private auth = inject(AuthService);
  private notifSvc = inject(NotificationService);

  username = '';
  email = '';
  get initials(): string {
    return this.username.slice(0, 2).toUpperCase() || 'U';
  }

  notifs: NotifItem[] = [];
  loading = true;
  activeFilter: 'all' | 'transactions' | 'system' = 'all';

  get filtered(): NotifItem[] {
    if (this.activeFilter === 'all') return this.notifs;
    if (this.activeFilter === 'transactions')
      return this.notifs.filter(
        (n) => n.iconType === 'up' || n.iconType === 'down' || n.iconType === 'transfer',
      );
    return this.notifs.filter((n) => n.iconType === 'info' || n.iconType === 'shield');
  }

  get groupedNotifs(): { label: string; items: NotifItem[] }[] {
    const groups: Record<string, NotifItem[]> = {};
    for (const n of this.filtered) {
      if (!groups[n.group]) groups[n.group] = [];
      groups[n.group].push(n);
    }
    return ['Today', 'Yesterday', 'Earlier']
      .filter((k) => groups[k])
      .map((k) => ({ label: k, items: groups[k] }));
  }

  ngOnInit(): void {
    this.notifSvc.getNotifications(0, 50).subscribe({
      next: (res) => {
        this.notifs = res.items;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  setFilter(f: typeof this.activeFilter): void {
    this.activeFilter = f;
  }

  logout(): void {
    this.auth.logout();
  }
}
