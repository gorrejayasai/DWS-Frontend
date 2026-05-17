import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TransactionResponse, PaginatedResponse, TransactionSummaryResponse } from '../models/transaction.model';

@Injectable({ providedIn: 'root' })
export class TransactionService {
  private http = inject(HttpClient);
  private BASE = environment.apiUrl;

  getMyTransactions(
    page = 0,
    size = 5,
    type?: string,
    status?: string,
  ): Observable<PaginatedResponse<TransactionResponse>> {
    let params = `page=${page}&size=${size}`;
    if (type && type !== 'ALL') params += `&type=${type}`;
    if (status && status !== 'ALL') params += `&status=${status}`;

    return this.http.get<PaginatedResponse<TransactionResponse>>(
      `${this.BASE}/transactions/users/me?${params}`,
    );
  }

  getTransactionSummary(): Observable<TransactionSummaryResponse> {
    return this.http.get<TransactionSummaryResponse>(`${this.BASE}/transactions/users/me/summary`);
  }
}
