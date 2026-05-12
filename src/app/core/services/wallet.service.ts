import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { WalletResponse } from '../models/wallet.model';

export interface TopUpRequest {
  amount: number;
  currency: string;
  idempotencyKey: string;
}

export interface TransferRequest {
  targetWalletId: number;
  amount: number;
  currency: string;
  idempotencyKey: string;
}

export interface WithdrawRequest {
  amount: number;
  currency: string;
  idempotencyKey: string;
}

@Injectable({ providedIn: 'root' })
export class WalletService {
  private http = inject(HttpClient);
  private BASE = environment.apiUrl;

  getMyWallet(): Observable<WalletResponse> {
    return this.http.get<WalletResponse>(`${this.BASE}/wallets/by-user`);
  }

  topUp(payload: TopUpRequest): Observable<any> {
    return this.http.post(`${this.BASE}/wallets/topup`, payload);
  }

  transfer(payload: TransferRequest): Observable<any> {
    return this.http.post(`${this.BASE}/wallets/transfer`, payload);
  }

  withdraw(payload: WithdrawRequest): Observable<any> {
    return this.http.post(`${this.BASE}/wallets/withdraw`, payload);
  }
}
