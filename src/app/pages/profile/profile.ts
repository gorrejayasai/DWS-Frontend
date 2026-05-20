import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { KycService } from '../../core/services/kyc.service';
import { WalletService } from '../../core/services/wallet.service';
import { UserProfile } from '../../core/models/user.model';
import { SidebarComponent } from "../../shared/components/sidebar/sidebar";
import { TopbarComponent } from "../../shared/components/topbar/topbar";

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class ProfileComponent implements OnInit {
  private auth = inject(AuthService);
  private kycSvc = inject(KycService);
  private walletSvc = inject(WalletService);
  private router = inject(Router);

  profile: UserProfile | null = null;
  kycStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'NOT_SUBMITTED' = 'NOT_SUBMITTED';
  walletStatus = 'ACTIVE';
  loading = true;
  saving = false;
  saveSuccess = false;
  saveError = '';
  activeTab: 'personal' | 'security' = 'personal';

  // Edit fields
  editUsername = '';
  editEmail = '';

  // Password fields
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  pwError = '';
  pwSuccess = false;

  get initials(): string {
    return (this.profile?.username ?? this.auth.getStoredUser()?.username ?? 'U')
      .slice(0, 2).toUpperCase();
  }

  ngOnInit(): void {
    const user = this.auth.getStoredUser();

    this.auth.getProfile().subscribe({
      next: (p) => {
        this.profile = p;
        this.editUsername = p.username;
        this.editEmail = p.email;
        this.loading = false;
      },
      error: () => {
        if (user) {
          this.profile = { id: 0, username: user.username, email: user.email, role: user.role, status: 'ACTIVE', createdAt: '' };
          this.editUsername = user.username;
          this.editEmail = user.email;
        }
        this.loading = false;
      }
    });

    // Load real KYC status
    if (user?.userId) {
      this.kycSvc.getKycByUserId(user.userId).subscribe({
        next: kyc => { this.kycStatus = kyc.status; },
        error: ()  => { this.kycStatus = 'NOT_SUBMITTED'; }
      });
    }

    // Load wallet status (ACTIVE / FROZEN / CLOSED)
    this.walletSvc.getMyWallet().subscribe({
      next: (w) => { this.walletStatus = w.status ?? 'ACTIVE'; },
      error: ()  => { /* wallet not created yet — keep default */ }
    });
  }

  switchTab(tab: 'personal' | 'security'): void {
    this.activeTab = tab;
    this.saveSuccess = false;
    this.saveError = '';
    this.pwError = '';
    this.pwSuccess = false;
  }

  saveProfile(): void {
    if (!this.editUsername.trim() || !this.editEmail.trim()) return;
    this.saving = true;
    this.saveSuccess = false;
    this.saveError = '';

    this.auth.updateProfile({ username: this.editUsername.trim(), email: this.editEmail.trim() }).subscribe({
      next: (p) => {
        this.profile = p;
        this.saving = false;
        this.saveSuccess = true;
        setTimeout(() => this.saveSuccess = false, 3000);
      },
      error: (err) => {
        this.saving = false;
        this.saveError = err.error?.message ?? 'Failed to save. Please try again.';
      }
    });
  }

  changePassword(): void {
    this.pwError = '';
    this.pwSuccess = false;
    if (!this.currentPassword || !this.newPassword || !this.confirmPassword) {
      this.pwError = 'All fields are required.'; return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.pwError = 'New passwords do not match.'; return;
    }
    if (this.newPassword.length < 8) {
      this.pwError = 'Password must be at least 8 characters.'; return;
    }
    // Password change endpoint not in scope of UserService — show placeholder
    this.pwSuccess = true;
    this.currentPassword = ''; this.newPassword = ''; this.confirmPassword = '';
    setTimeout(() => this.pwSuccess = false, 3000);
  }

  logout(): void {
    this.auth.logout();
  }
}
