import { Router, Request, Response } from "express";
import {
  Notification,
  NotificationType,
  NotificationChannel,
  NotificationStatus,
  generateId,
} from "@finserv/common";
import { Logger } from "@finserv/logger";
import { notificationStore } from "../data/store";
import { dispatchNotification } from "../services/dispatcher";

const logger = new Logger("notification-service:notifications");

export const notificationsRouter = Router();

notificationsRouter.get("/", (req: Request, res: Response) => {
  const userId = req.query.userId as string;
  const status = req.query.status as NotificationStatus;

  let notifications = notificationStore.getAll();

  if (userId) {
    notifications = notifications.filter((n) => n.userId === userId);
  }

  if (status) {
    notifications = notifications.filter((n) => n.status === status);
  }

  notifications.sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );

  res.json({ data: notifications, total: notifications.length });
});

notificationsRouter.post("/", (req: Request, res: Response) => {
  const { userId, type, channel, subject, body, metadata } = req.body;

  if (!userId || !type || !channel || !subject || !body) {
    res.status(400).json({
      error: "userId, type, channel, subject, and body are required",
    });
    return;
  }

  const notification: Notification = {
    id: generateId(),
    userId,
    type: type as NotificationType,
    channel: channel as NotificationChannel,
    subject,
    body,
    status: NotificationStatus.QUEUED,
    metadata,
    createdAt: new Date(),
  };

  notificationStore.create(notification);
  logger.info(`Notification queued: ${notification.id}`, {
    type,
    channel,
    userId,
  });

  dispatchNotification(notification);

  res.status(201).json({ data: notification });
});

notificationsRouter.post("/bulk", (req: Request, res: Response) => {
  const { notifications } = req.body;

  if (!Array.isArray(notifications) || notifications.length === 0) {
    res.status(400).json({ error: "notifications array is required" });
    return;
  }

  const created: Notification[] = [];

  for (const item of notifications) {
    const notification: Notification = {
      id: generateId(),
      userId: item.userId,
      type: item.type as NotificationType,
      channel: item.channel as NotificationChannel,
      subject: item.subject,
      body: item.body,
      status: NotificationStatus.QUEUED,
      metadata: item.metadata,
      createdAt: new Date(),
    };

    notificationStore.create(notification);
    created.push(notification);

    dispatchNotification(notification);
  }

  logger.info(`Bulk notifications queued: ${created.length}`);
  res.status(201).json({ data: created, total: created.length });
});

notificationsRouter.get("/:id", (req: Request, res: Response) => {
  const notification = notificationStore.getById(req.params.id!);

  if (!notification) {
    res.status(404).json({ error: "Notification not found" });
    return;
  }

  res.json({ data: notification });
});
