import { pool } from "../../config/database";
import { ValidationError } from "../../shared/errors";
import { optionalText, requiredText } from "../../shared/validation";
import { NotificationRepository, type NotificationRecord, type NotificationType } from "./notification.repository";

const notificationTypes = new Set<NotificationType>(["info", "warning", "success", "alert"]);

function notificationType(value: unknown): NotificationType {
  const normalized = optionalText(value, "Notification type", 20) ?? "info";
  if (!notificationTypes.has(normalized as NotificationType)) {
    throw new ValidationError("Notification type must be info, warning, success, or alert.");
  }
  return normalized as NotificationType;
}

function publicNotification(notification: NotificationRecord) {
  return {
    id: notification.id,
    title: notification.title,
    message: notification.message,
    type: notification.type,
    isRead: notification.isRead,
    time: notification.createdAt.toISOString(),
  };
}

export class NotificationService {
  constructor(private readonly repository = new NotificationRepository()) {}

  async create(organizationId: string, input: Record<string, unknown>) {
    const title = requiredText(input.title, "Notification title", 255);
    const message = requiredText(input.message, "Notification message", 5_000);
    const type = notificationType(input.type);
    const client = await pool.connect();
    try {
      return publicNotification(await this.repository.create(client, { organizationId, title, message, type }));
    } finally {
      client.release();
    }
  }

  async list(organizationId: string) {
    const client = await pool.connect();
    try {
      return (await this.repository.list(client, organizationId)).map(publicNotification);
    } finally {
      client.release();
    }
  }
}
