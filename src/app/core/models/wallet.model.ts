export interface WalletResponse {
  id: number;
  userId: number;
  currency: string;
  availableBalance: number;
  heldBalance: number;
  status: 'ACTIVE' | 'FROZEN' | 'CLOSED';
  createdAt: string;
}
