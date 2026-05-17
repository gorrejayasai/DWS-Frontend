import { Component, Input, OnDestroy, ElementRef, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { NotifItem } from '../../../core/models/notification.model';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './topbar.html',
  styleUrl: './topbar.css',
})
export class TopbarComponent implements OnDestroy {
  private auth = inject(AuthService);
  private notifSvc = inject(NotificationService);
  private el = inject(ElementRef);

  @Input() title = '';
  @Input() subtitle = '';
  @Input() showNotifications = true;

  panelOpen = false;
  notifLoading = false;
  notifFetched = false;
  notifs: NotifItem[] = [];

  get initials(): string {
    const u = this.auth.getUser()?.username ?? 'U';
    return u.slice(0, 2).toUpperCase() || 'U';
  }

  get recentNotifs(): NotifItem[] {
    return this.notifs.slice(0, 5);
  }

  togglePanel(): void {
    this.panelOpen = !this.panelOpen;
    if (this.panelOpen && !this.notifFetched) {
      this.loadNotifs();
    }
  }

  closePanel(): void {
    this.panelOpen = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.panelOpen && !this.el.nativeElement.contains(event.target)) {
      this.panelOpen = false;
    }
  }

  private loadNotifs(): void {
    this.notifLoading = true;
    this.notifSvc.getNotifications(0, 5).subscribe({
      next: (res) => {
        this.notifs = res.items;
        this.notifLoading = false;
        this.notifFetched = true;
      },
      error: () => {
        this.notifLoading = false;
        this.notifFetched = true;
      },
    });
  }

  ngOnDestroy(): void {
    this.panelOpen = false;
  }
}
