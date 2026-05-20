export interface TransactionResponse {
  id: number;
  transactionId: string;
  walletId: number;
  targetWalletId: number | null;
  targetUserId: number | null;
  userId: number;
  username: string | null;
  targetUsername: string | null;
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
  page: number;
  pageSize: number;
}

export interface AmountCount {
  totalAmount: number;
  count: number;
}

export interface OverallStats {
  totalTransactions: number;
  netFlow: number;
}

export interface TransactionSummaryResponse {
  walletId: number;
  currency: string;
  currentBalance: number;
  topup: AmountCount;
  withdraw: AmountCount;
  transfersSent: AmountCount;
  transfersReceived: AmountCount;
  overall: OverallStats;
}
