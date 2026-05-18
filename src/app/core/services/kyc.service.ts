import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { KycSubmitData, KycResponse } from '../models/kyc.model';

@Injectable({ providedIn: 'root' })
export class KycService {
  private http = inject(HttpClient);
  private BASE = environment.apiUrl;

  getKycByUserId(userId: number): Observable<KycResponse> {
    // GET /kyc/{userId} — works for both USER (own) and ADMIN (any)
    return this.http.get<KycResponse>(`${this.BASE}/kyc/${userId}`);
  }

  submitKyc(data: KycSubmitData, file: File): Observable<KycResponse> {
    const fd = new FormData();
    // 'data' part must be application/json so Spring can deserialize it with @RequestPart
    fd.append('data', new Blob([JSON.stringify(data)], { type: 'application/json' }));
    fd.append('file', file, file.name);
    return this.http.post<KycResponse>(`${this.BASE}/kyc/submit`, fd);
  }

  updateKyc(data: KycSubmitData, file: File): Observable<KycResponse> {
    const fd = new FormData();
    fd.append('data', new Blob([JSON.stringify(data)], { type: 'application/json' }));
    fd.append('file', file, file.name);
    return this.http.put<KycResponse>(`${this.BASE}/kyc/user/update`, fd);
  }

  viewDocument(docId: number): Observable<Blob> {
    return this.http.get(`${this.BASE}/kyc/document/${docId}`, { responseType: 'blob' });
  }
}
