import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './signup.html',
  styleUrl: './signup.css'
})
export class SignupComponent implements OnInit {
  private auth   = inject(AuthService);
  private router = inject(Router);

  username        = '';
  email           = '';
  password        = '';
  confirmPassword = '';
  termsAccepted   = false;
  showPassword    = false;
  showConfirm     = false;
  loading         = false;
  errorMsg        = '';
  successMsg      = '';

  features = [
    'Free account — no credit card needed',
    'Transfers complete in under 2 seconds',
    'Bank-grade 256-bit encryption',
    'Real-time notifications on every transaction',
    'Zero-fee transfers this month'
  ];

  // Password strength
  strengthWidth = '0%';
  strengthColor = '#d1d5db';
  strengthLabel = '';

  ngOnInit(): void {
    if (this.auth.isLoggedIn()) {
      this.router.navigate(['/dashboard']);
    }
  }

  // ─── Password strength ───────────────────────────────────────────────────────
  onPasswordChange(val: string): void {
    if (!val) {
      this.strengthWidth = '0%';
      this.strengthColor = '#d1d5db';
      this.strengthLabel = '';
      return;
    }
    let score = 0;
    if (val.length >= 8)           score++;
    if (val.length >= 12)          score++;
    if (/[A-Z]/.test(val))         score++;
    if (/[0-9]/.test(val))         score++;
    if (/[^A-Za-z0-9]/.test(val))  score++;

    const map = [
      { w: '20%', c: '#EF4444', l: 'Too weak' },
      { w: '40%', c: '#F59E0B', l: 'Weak'     },
      { w: '60%', c: '#F59E0B', l: 'Fair'     },
      { w: '80%', c: '#10B981', l: 'Good'     },
      { w: '100%', c: '#10B981', l: 'Strong'  }
    ];
    const s = map[Math.max(0, score - 1)];
    this.strengthWidth = s.w;
    this.strengthColor = s.c;
    this.strengthLabel = s.l;
  }

  // ─── Submit ──────────────────────────────────────────────────────────────────
  onSubmit(): void {
    this.errorMsg  = '';
    this.successMsg = '';

    // ── Client-side validation ──────────────────────────────────────────────
    if (!this.username.trim()) {
      this.errorMsg = 'Username is required.';
      return;
    }
    if (this.username.trim().length < 3) {
      this.errorMsg = 'Username must be at least 3 characters.';
      return;
    }
    if (!this.email.trim()) {
      this.errorMsg = 'Email address is required.';
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email.trim())) {
      this.errorMsg = 'Please enter a valid email address.';
      return;
    }
    if (!this.password) {
      this.errorMsg = 'Password is required.';
      return;
    }
    if (this.password.length < 8) {
      this.errorMsg = 'Password must be at least 8 characters.';
      return;
    }
    if (this.password !== this.confirmPassword) {
      this.errorMsg = 'Passwords do not match.';
      return;
    }
    if (!this.termsAccepted) {
      this.errorMsg = 'You must accept the Terms of Service to continue.';
      return;
    }

    // ── API call ──────────────────────────────────────────────────────────────
    this.loading = true;
    this.auth.signup({
      username: this.username.trim(),
      email:    this.email.trim(),
      password: this.password
    }).subscribe({
      next: () => {
        this.loading    = false;
        this.successMsg = 'Account created! Redirecting to login…';
        setTimeout(() => this.router.navigate(['/login']), 1800);
      },
      error: (err) => {
        this.loading = false;
        // Try every common Spring Boot error body format
        const body = err.error;
        if (typeof body === 'string') {
          this.errorMsg = body;
        } else if (body?.message) {
          this.errorMsg = body.message;
        } else if (body?.error) {
          this.errorMsg = body.error;
        } else if (err.status === 409) {
          this.errorMsg = 'Username or email already exists. Please choose another.';
        } else if (err.status === 400) {
          this.errorMsg = 'Invalid details provided. Please check your inputs.';
        } else if (err.status === 0) {
          this.errorMsg = 'Cannot reach the server. Make sure the backend is running.';
        } else {
          this.errorMsg = 'Signup failed. Please try again.';
        }
      }
    });
  }
}
