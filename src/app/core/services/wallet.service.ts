import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { WalletResponse } from '../models/wallet.model';

// Backend DTOs — no idempotencyKey (not in backend records)
export interface TopUpRequest {
  amount: number;
  currency: string;
}
export interface TransferRequest {
  targetUsername: string;
  amount: number;
  currency: string;
}
export interface WithdrawRequest {
  amount: number;
  currency: string;
}

@Injectable({ providedIn: 'root' })
export class WalletService {
  private http = inject(HttpClient);
  private BASE = environment.apiUrl;

  getMyWallet(): Observable<WalletResponse> {
    return this.http.get<WalletResponse>(`${this.BASE}/wallets/by-user`);
  }

  // Backend: POST /wallets/{walletId}/topup
  topUp(walletId: number, payload: TopUpRequest): Observable<any> {
    return this.http.post(`${this.BASE}/wallets/${walletId}/topup`, payload);
  }

  // Backend: POST /wallets/{walletId}/transfer
  transfer(walletId: number, payload: TransferRequest): Observable<any> {
    return this.http.post(`${this.BASE}/wallets/${walletId}/transfer`, payload);
  }

  // Backend: POST /wallets/{walletId}/withdraw
  withdraw(walletId: number, payload: WithdrawRequest): Observable<any> {
    return this.http.post(`${this.BASE}/wallets/${walletId}/withdraw`, payload);
  }

  // Backend: PUT /wallets/{walletId}/freeze
  freezeWallet(walletId: number): Observable<WalletResponse> {
    return this.http.put<WalletResponse>(`${this.BASE}/wallets/${walletId}/freeze`, {});
  }

  // Backend: PUT /wallets/{walletId}/unfreeze
  unfreezeWallet(walletId: number): Observable<WalletResponse> {
    return this.http.put<WalletResponse>(`${this.BASE}/wallets/${walletId}/unfreeze`, {});
  }
}
