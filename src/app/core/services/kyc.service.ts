import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { KycSubmitRequest, KycResponse } from '../models/kyc.model';

@Injectable({ providedIn: 'root' })
export class KycService {
  private http = inject(HttpClient);
  private BASE = environment.apiUrl;

  // Backend has no GET /kyc/me — admin can fetch by userId via /kyc/admin/{userId}
  getKycByUserId(userId: number): Observable<KycResponse> {
    return this.http.get<KycResponse>(`${this.BASE}/kyc/${userId}`);
  }

  submitKyc(payload: KycSubmitRequest): Observable<KycResponse> {
    return this.http.post<KycResponse>(`${this.BASE}/kyc/submit`, payload);
  }

  // Correct backend URL: PUT /kyc/user/update
  updateKyc(payload: KycSubmitRequest): Observable<KycResponse> {
    return this.http.put<KycResponse>(`${this.BASE}/kyc/user/update`, payload);
  }
}
