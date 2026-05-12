import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin-settings.html',
  styleUrl: './admin-settings.css'
})
export class AdminSettingsComponent {
  private auth = inject(AuthService);

  username = '';
  get initials(): string { return this.username.slice(0, 2).toUpperCase() || 'A'; }

  sidebarExpanded = false;

  // Transaction limits
  maxTopupPerTx     = 50000;
  maxTransferPerTx  = 100000;
  maxWithdrawPerTx  = 50000;
  maxWalletBalance  = 1000000;

  // System
  maintenanceMode = false;

  saved = false;

  constructor() {
    const user = this.auth.getUser();
    this.username = user?.username ?? 'Admin';
  }

  saveSettings(): void {
    this.saved = true;
    setTimeout(() => { this.saved = false; }, 2000);
  }

  toggleSidebar(): void { this.sidebarExpanded = !this.sidebarExpanded; }
  logout(): void { this.auth.logout(); }
}
