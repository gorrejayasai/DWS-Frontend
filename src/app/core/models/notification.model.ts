export interface NotificationResponse {
  id: number;
  userId: number;
  channel: 'EMAIL' | 'SMS' | 'PUSH';
  status: 'PENDING' | 'SENT' | 'FAILED';
  templateCode: string;
  recipient: string;
  attempts: number;
  lastError: string | null;
  createdAt: string;
  sentAt: string | null;
}

export interface NotificationPage {
  content: NotificationResponse[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

// Display model used by both the topbar panel and the notifications page
export interface NotifItem {
  id: number;
  iconBg: string;
  iconColor: string;
  iconType: 'up' | 'down' | 'transfer' | 'info' | 'shield';
  title: string;
  desc: string;
  time: string;
  group: string;
}
