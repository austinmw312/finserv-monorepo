import {
  Notification,
  NotificationChannel,
  NotificationStatus,
} from "@finserv/common";
import { Logger } from "@finserv/logger";
import { notificationStore } from "../data/store";
import { renderTemplate } from "./templates";

const logger = new Logger("notification-service:dispatcher");

const EMAIL_API_URL = process.env.EMAIL_API_URL || "https://api.email-provider.internal";
const SMS_API_URL = process.env.SMS_API_URL || "https://api.sms-provider.internal";

async function sendEmail(
  to: string,
  subject: string,
  body: string
): Promise<void> {
  const response = await fetch(`${EMAIL_API_URL}/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ to, subject, html: body }),
  });

  if (!response.ok) {
    throw new Error(`Email API returned ${response.status}: ${response.statusText}`);
  }
}

async function sendSMS(to: string, body: string): Promise<void> {
  const response = await fetch(`${SMS_API_URL}/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ to, message: body }),
  });

  if (!response.ok) {
    throw new Error(`SMS API returned ${response.status}: ${response.statusText}`);
  }
}

async function sendPush(userId: string, subject: string, body: string): Promise<void> {
  logger.info(`Push notification sent to ${userId}: ${subject}`);
  await new Promise((resolve) => setTimeout(resolve, 10));
}

export function dispatchNotification(notification: Notification): void {
  const rendered = renderTemplate(notification);

  const sendFn = async () => {
    switch (notification.channel) {
      case NotificationChannel.EMAIL:
        await sendEmail(notification.userId, rendered.subject, rendered.body);
        break;
      case NotificationChannel.SMS:
        await sendSMS(notification.userId, rendered.body);
        break;
      case NotificationChannel.PUSH:
        await sendPush(notification.userId, rendered.subject, rendered.body);
        break;
    }

    const updated: Notification = {
      ...notification,
      status: NotificationStatus.SENT,
      sentAt: new Date(),
    };
    notificationStore.update(updated);
    logger.info(`Notification sent: ${notification.id}`);
  };

  sendFn();
}
