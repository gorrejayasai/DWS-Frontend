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
  private auth   = inject(AuthService);
  private kycSvc = inject(KycService);

  username = '';
  email    = '';
  get initials(): string { return this.username.slice(0, 2).toUpperCase() || 'U'; }

  kyc: KycResponse | null = null;
  kycLoading = true;

  // Form fields
  idType: 'AADHAAR' | 'PAN' = 'AADHAAR';
  verifiedName  = '';
  verifiedDob   = '';
  docNumber     = '';
  selectedFile: File | null = null;

  loading    = false;
  errorMsg   = '';
  successMsg = '';

  // ── Validation ────────────────────────────────────────────────────────────
  get aadhaarRegex() { return /^[0-9]{12}$/; }
  get panRegex()     { return /^[A-Z0-9]{10}$/; }

  get isDocValid(): boolean {
    if (this.idType === 'AADHAAR') return this.aadhaarRegex.test(this.docNumber);
    return this.panRegex.test(this.docNumber.toUpperCase()) && this.alphabetCount >= 4;
  }

  get alphabetCount(): number {
    return (this.docNumber.match(/[a-zA-Z]/g) || []).length;
  }

  /** Max DOB = 18 years ago today */
  get maxDob(): string {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 18);
    return d.toISOString().split('T')[0];
  }

  get hint(): { text: string; cls: string } {
    if (!this.docNumber) {
      return this.idType === 'AADHAAR'
        ? { text: 'Enter your 12-digit Aadhaar number', cls: 'hint' }
        : { text: 'Enter your PAN (e.g. ABCDE1234F)', cls: 'hint' };
    }
    if (this.isDocValid) return { text: '✓ Valid format', cls: 'ok' };
    return this.idType === 'AADHAAR'
      ? { text: 'Must be exactly 12 digits', cls: 'err' }
      : { text: 'Must be 10 alphanumeric characters with at least 4 letters', cls: 'err' };
  }

  get placeholder(): string {
    return this.idType === 'AADHAAR' ? '123456789012' : 'ABCDE1234F';
  }

  get maxLen(): number { return this.idType === 'AADHAAR' ? 12 : 10; }

  get canSubmit(): boolean {
    return this.isDocValid &&
           !!this.verifiedName.trim() &&
           !!this.verifiedDob &&
           !!this.selectedFile &&
           !this.loading;
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  ngOnInit(): void {
    const user    = this.auth.getUser();
    this.username = user?.username ?? 'User';
    this.email    = user?.email ?? '';
    this.loadKyc(user?.userId);
  }

  loadKyc(userId?: number): void {
    this.kycLoading = true;
    if (!userId) { this.kycLoading = false; return; }
    this.kycSvc.getKycByUserId(userId).subscribe({
      next:  k  => { this.kyc = k; this.kycLoading = false; },
      error: () => { this.kycLoading = false; }  // 404 = no KYC yet, show form
    });
  }

  switchIdType(type: 'AADHAAR' | 'PAN'): void {
    this.idType       = type;
    this.docNumber    = '';
    this.selectedFile = null;
    this.errorMsg     = '';
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
    }
  }

  removeFile(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.selectedFile = null;
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  onSubmit(): void {
    if (!this.canSubmit) return;
    this.loading    = true;
    this.errorMsg   = '';
    this.successMsg = '';

    const data = {
      verificationType: this.idType === 'AADHAAR' ? 'AADHAAR_BASED' as const : 'PAN_BASED' as const,
      verifiedName:  this.verifiedName.trim(),
      verifiedDob:   this.verifiedDob,
      documentNumber: this.idType === 'AADHAAR' ? this.docNumber : this.docNumber.toUpperCase()
    };

    const isUpdate = this.kyc?.status === 'REJECTED';
    const call     = isUpdate
      ? this.kycSvc.updateKyc(data, this.selectedFile!)
      : this.kycSvc.submitKyc(data, this.selectedFile!);

    call.subscribe({
      next: res => {
        this.loading      = false;
        this.kyc          = res;
        this.selectedFile = null;
        this.successMsg   = isUpdate
          ? 'KYC updated successfully. Awaiting admin review.'
          : 'KYC submitted successfully. An admin will review your documents.';
      },
      error: err => {
        this.loading = false;
        const body   = err.error;
        if      (err.status === 403)       this.errorMsg = 'Submission not allowed. Please contact support.';
        else if (body?.message)            this.errorMsg = body.message;
        else if (typeof body === 'string') this.errorMsg = body;
        else if (err.status === 409)       this.errorMsg = 'A KYC record already exists. Contact support to reset.';
        else                               this.errorMsg = 'Submission failed. Please try again.';
      }
    });
  }

  logout(): void { this.auth.logout(); }

  fmtDate(d: string): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}
