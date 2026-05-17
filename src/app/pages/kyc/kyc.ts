import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { KycService } from '../../core/services/kyc.service';
import { KycResponse } from '../../core/models/kyc.model';
import { SidebarComponent } from "../../shared/components/sidebar/sidebar";
import { TopbarComponent } from "../../shared/components/topbar/topbar";

@Component({
  selector: 'app-kyc',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, SidebarComponent, TopbarComponent],
  templateUrl: './kyc.html',
  styleUrl: './kyc.css'
})
export class KycComponent implements OnInit {
  private auth = inject(AuthService);
  private kycSvc = inject(KycService);

  username = '';
  email = '';
  get initials(): string { return this.username.slice(0, 2).toUpperCase() || 'U'; }

  kyc: KycResponse | null = null;
  kycLoading = true;

  // Form — ONE ID_PROOF document (Aadhaar OR PAN)
  idType: 'AADHAAR' | 'PAN' = 'AADHAAR';
  docNumber = '';
  loading = false;
  errorMsg = '';
  successMsg = '';

  // ── Validation ────────────────────────────────────────────────────────
  get aadhaarRegex() { return /^[0-9]{12}$/; }
  get panRegex()     { return /^[A-Z0-9]{10}$/; }

  get isValid(): boolean {
    if (this.idType === 'AADHAAR') return this.aadhaarRegex.test(this.docNumber);
    return this.panRegex.test(this.docNumber.toUpperCase()) && this.alphabetCount >= 4;
  }

  get alphabetCount(): number {
    return (this.docNumber.match(/[a-zA-Z]/g) || []).length;
  }

  get hint(): { text: string; cls: string } {
    if (!this.docNumber) {
      return this.idType === 'AADHAAR'
        ? { text: 'Enter your 12-digit Aadhaar number', cls: 'hint' }
        : { text: 'Enter your PAN (e.g. ABCDE1234F)', cls: 'hint' };
    }
    if (this.isValid) return { text: '✓ Valid format', cls: 'ok' };
    return this.idType === 'AADHAAR'
      ? { text: 'Must be exactly 12 digits', cls: 'err' }
      : { text: 'Must be 10 alphanumeric characters with at least 4 letters', cls: 'err' };
  }

  get placeholder(): string {
    return this.idType === 'AADHAAR' ? '123456789012' : 'ABCDE1234F';
  }

  get maxLen(): number { return this.idType === 'AADHAAR' ? 12 : 10; }

  get canSubmit(): boolean { return this.isValid && !this.loading; }

  // ── Lifecycle ────────────────────────────────────────────────────────
  ngOnInit(): void {
    const user = this.auth.getUser();
    this.username = user?.username ?? 'User';
    this.email    = user?.email ?? '';
    this.loadKyc(user?.userId);
  }

  loadKyc(userId?: number): void {
    this.kycLoading = true;
    if (!userId) { this.kycLoading = false; return; }
    this.kycSvc.getKycByUserId(userId).subscribe({
      next: k  => { this.kyc = k; this.kycLoading = false; },
      error: () => { this.kycLoading = false; }   // 404 = no KYC yet, show form
    });
  }

  switchIdType(type: 'AADHAAR' | 'PAN'): void {
    this.idType = type;
    this.docNumber = '';
    this.errorMsg = '';
  }

  // ── Submit ───────────────────────────────────────────────────────────
  onSubmit(): void {
    if (!this.canSubmit) return;
    this.loading  = true;
    this.errorMsg = '';
    this.successMsg = '';

    const number = this.idType === 'AADHAAR' ? this.docNumber : this.docNumber.toUpperCase();

    // Backend expects: documentType (ID_PROOF), documentNumber, fileName, fileReference
    // Only ONE ID_PROOF document is allowed per submission
    const payload = {
      documents: [
        {
          documentType: 'ID_PROOF' as const,
          documentNumber: number,
          fileName: `${this.idType.toLowerCase()}.pdf`,
          fileReference: `${this.idType}-${number}`
        }
      ]
    };

    // PENDING is now locked (form hidden), so only REJECTED reaches here as an update
    const isUpdate = this.kyc?.status === 'REJECTED';
    const call = isUpdate ? this.kycSvc.updateKyc(payload) : this.kycSvc.submitKyc(payload);

    call.subscribe({
      next: res => {
        this.loading = false;
        this.kyc = res;
        this.successMsg = isUpdate
          ? 'KYC updated successfully. Awaiting admin review.'
          : 'KYC submitted successfully. An admin will review your documents.';
      },
      error: err => {
        this.loading = false;
        const body = err.error;
        if (err.status === 403)               this.errorMsg = 'Resubmission is temporarily unavailable. Please contact support.';
        else if (body?.message)               this.errorMsg = body.message;
        else if (typeof body === 'string')    this.errorMsg = body;
        else if (err.status === 409)          this.errorMsg = 'A KYC record already exists. Please contact support if you cannot resubmit.';
        else                                  this.errorMsg = 'Submission failed. Please try again.';
      }
    });
  }

  logout(): void { this.auth.logout(); }

  fmtDate(d: string): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}
