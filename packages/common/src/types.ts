export interface Account {
  id: string;
  userId: string;
  email: string;
  name: string;
  balance: number;
  currency: string;
  status: AccountStatus;
  kycStatus: KYCStatus;
  createdAt: Date;
  updatedAt: Date;
}

export enum AccountStatus {
  ACTIVE = "active",
  SUSPENDED = "suspended",
  CLOSED = "closed",
}

export enum KYCStatus {
  PENDING = "pending",
  IN_REVIEW = "in_review",
  APPROVED = "approved",
  REJECTED = "rejected",
}

export interface Trade {
  id: string;
  accountId: string;
  symbol: string;
  side: "buy" | "sell";
  quantity: number;
  price: number;
  total: number;
  fee: number;
  status: TradeStatus;
  createdAt: Date;
  executedAt?: Date;
}

export enum TradeStatus {
  PENDING = "pending",
  EXECUTED = "executed",
  FAILED = "failed",
  CANCELLED = "cancelled",
}

export interface Position {
  accountId: string;
  symbol: string;
  quantity: number;
  avgCost: number;
  currentPrice: number;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  channel: NotificationChannel;
  subject: string;
  body: string;
  status: NotificationStatus;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  sentAt?: Date;
  error?: string;
}

export enum NotificationType {
  TRADE_EXECUTED = "trade_executed",
  TRADE_FAILED = "trade_failed",
  KYC_APPROVED = "kyc_approved",
  KYC_REJECTED = "kyc_rejected",
  BALANCE_LOW = "balance_low",
  SECURITY_ALERT = "security_alert",
}

export enum NotificationChannel {
  EMAIL = "email",
  SMS = "sms",
  PUSH = "push",
}

export enum NotificationStatus {
  QUEUED = "queued",
  SENT = "sent",
  FAILED = "failed",
}

export interface TransferRequest {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  currency: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface ServiceHealthStatus {
  service: string;
  status: "healthy" | "degraded" | "down";
  latencyMs?: number;
  lastChecked: Date;
}
