import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-admin-health',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-health.html',
  styleUrl: './admin-health.css'
})
export class AdminHealthComponent {
  private auth = inject(AuthService);

  username = '';
  get initials(): string { return this.username.slice(0, 2).toUpperCase() || 'A'; }

  sidebarExpanded = false;

  services = [
    { name: 'API Gateway',          port: 8081, status: 'UP' },
    { name: 'User Service',         port: 8082, status: 'UP' },
    { name: 'KYC Service',          port: 8083, status: 'UP' },
    { name: 'Wallet Service',       port: 8084, status: 'UP' },
    { name: 'Notification Service', port: 8086, status: 'UP' },
    { name: 'Eureka Server',        port: 8761, status: 'UP' }
  ];

  constructor() {
    const user = this.auth.getUser();
    this.username = user?.username ?? 'Admin';
  }

  get allUp(): boolean { return this.services.every(s => s.status === 'UP'); }
  get upCount(): number { return this.services.filter(s => s.status === 'UP').length; }
  get downCount(): number { return this.services.filter(s => s.status !== 'UP').length; }

  toggleSidebar(): void { this.sidebarExpanded = !this.sidebarExpanded; }
  logout(): void { this.auth.logout(); }
}
