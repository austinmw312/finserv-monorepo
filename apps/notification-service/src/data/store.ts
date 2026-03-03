import { Notification, NotificationType, NotificationChannel, NotificationStatus } from "@finserv/common";

class NotificationStore {
  private notifications: Map<string, Notification> = new Map();

  constructor() {
    this.seed();
  }

  private seed(): void {
    const seedNotifications: Notification[] = [
      {
        id: "ntf-001",
        userId: "usr-001",
        type: NotificationType.TRADE_EXECUTED,
        channel: NotificationChannel.EMAIL,
        subject: "Trade Executed: AAPL",
        body: "Your buy order for 100 shares of AAPL has been executed.",
        status: NotificationStatus.SENT,
        createdAt: new Date("2024-10-15T10:30:05Z"),
        sentAt: new Date("2024-10-15T10:30:06Z"),
      },
      {
        id: "ntf-002",
        userId: "usr-003",
        type: NotificationType.KYC_APPROVED,
        channel: NotificationChannel.EMAIL,
        subject: "KYC Verification Pending",
        body: "Your identity verification is being processed.",
        status: NotificationStatus.QUEUED,
        createdAt: new Date("2024-11-01T08:00:00Z"),
      },
    ];

    for (const notification of seedNotifications) {
      this.notifications.set(notification.id, notification);
    }
  }

  getAll(): Notification[] {
    return Array.from(this.notifications.values());
  }

  getById(id: string): Notification | undefined {
    return this.notifications.get(id);
  }

  getByUserId(userId: string): Notification[] {
    return Array.from(this.notifications.values()).filter(
      (n) => n.userId === userId
    );
  }

  create(notification: Notification): void {
    this.notifications.set(notification.id, notification);
  }

  update(notification: Notification): void {
    this.notifications.set(notification.id, notification);
  }
}

export const notificationStore = new NotificationStore();
