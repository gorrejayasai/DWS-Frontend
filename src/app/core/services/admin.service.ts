import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PaginatedResponse, TransactionResponse } from '../models/transaction.model';
import { KycResponse } from '../models/kyc.model';

export interface AdminUser {
  id: number;
  username: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private http = inject(HttpClient);
  private BASE = environment.apiUrl;

  // ── Users ────────────────────────────────────────────────────────────────
  getAllUsers(page = 0, size = 10): Observable<PaginatedResponse<AdminUser>> {
    return this.http.get<PaginatedResponse<AdminUser>>(
      `${this.BASE}/user/admin/users?page=${page}&size=${size}`
    );
  }

  getUserById(id: number): Observable<AdminUser> {
    return this.http.get<AdminUser>(`${this.BASE}/user/admin/users/${id}`);
  }

  updateUserStatus(id: number, status: string): Observable<any> {
    return this.http.put(`${this.BASE}/user/admin/users/${id}/status`, { status });
  }

  // ── KYC — backend returns plain List<KycResponse> (not paginated) ────────
  getAllKyc(): Observable<KycResponse[]> {
    return this.http.get<KycResponse[]>(`${this.BASE}/kyc/admin/all`);
  }

  getKycByUserId(userId: number): Observable<KycResponse> {
    return this.http.get<KycResponse>(`${this.BASE}/kyc/admin/${userId}`);
  }

  // Correct URLs: /kyc/admin/approve/{userId}  and  /kyc/admin/reject/{userId}
  // remarks is optional on approve — send null to avoid @NotBlank failure on empty string
  approveKyc(userId: number): Observable<any> {
    return this.http.put(`${this.BASE}/kyc/admin/approve/${userId}`, { remarks: null });
  }

  rejectKyc(userId: number, remarks: string): Observable<any> {
    return this.http.put(`${this.BASE}/kyc/admin/reject/${userId}`, { remarks });
  }

  // ── Transactions ─────────────────────────────────────────────────────────
  getAllTransactions(page = 0, size = 10): Observable<PaginatedResponse<TransactionResponse>> {
    return this.http.get<PaginatedResponse<TransactionResponse>>(
      `${this.BASE}/transactions/admin/all?page=${page}&size=${size}`
    );
  }
}
