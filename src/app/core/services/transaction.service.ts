import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TransactionResponse, PaginatedResponse } from '../models/transaction.model';

@Injectable({ providedIn: 'root' })
export class TransactionService {
  private http = inject(HttpClient);
  private BASE = environment.apiUrl;

  getMyTransactions(page = 0, size = 5): Observable<PaginatedResponse<TransactionResponse>> {
    return this.http.get<PaginatedResponse<TransactionResponse>>(
      `${this.BASE}/transactions/me?page=${page}&size=${size}`
    );
  }
}
