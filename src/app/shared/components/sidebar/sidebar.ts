import { Component, OnInit, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { KycService } from '../../../core/services/kyc.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class SidebarComponent implements OnInit {
  private auth   = inject(AuthService);
  private kycSvc = inject(KycService);

  kycApproved = false;

  get username(): string {
    return this.auth.getUser()?.username ?? 'User';
  }
  get email(): string {
    return this.auth.getUser()?.email ?? '';
  }
  get initials(): string {
    return this.username.slice(0, 2).toUpperCase() || 'U';
  }

  ngOnInit(): void {
    const user = this.auth.getUser();
    if (user?.userId) {
      this.kycSvc.getKycByUserId(user.userId).subscribe({
        next: (kyc) => { this.kycApproved = kyc.status === 'APPROVED'; },
        error: ()    => { this.kycApproved = false; }
      });
    }
  }

  showLogoutModal = false;

  logout(): void { this.showLogoutModal = true; }
  closeLogoutModal(): void { this.showLogoutModal = false; }
  doLogout(): void { this.showLogoutModal = false; this.auth.logout(); }
}
