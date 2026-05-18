import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class SidebarComponent {
  private auth = inject(AuthService);

  get username(): string {
    return this.auth.getUser()?.username ?? 'User';
  }
  get email(): string {
    return this.auth.getUser()?.email ?? '';
  }
  get initials(): string {
    return this.username.slice(0, 2).toUpperCase() || 'U';
  }

  showLogoutModal = false;

  logout(): void { this.showLogoutModal = true; }
  closeLogoutModal(): void { this.showLogoutModal = false; }
  doLogout(): void { this.showLogoutModal = false; this.auth.logout(); }
}
