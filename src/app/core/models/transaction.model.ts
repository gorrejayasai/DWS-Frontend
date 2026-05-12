export interface TransactionResponse {
  id: number;
  transactionId: string;
  walletId: number;
  targetWalletId: number | null;
  userId: number;
  type: 'TOPUP' | 'WITHDRAW' | 'TRANSFER';
  amount: number;
  currency: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  metadata: string | null;
  idempotencyKey: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}
