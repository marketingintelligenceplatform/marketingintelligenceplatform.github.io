import type { PoolClient } from "pg";

export type NotificationType = "info" | "warning" | "success" | "alert";

export interface NotificationRecord {
  id: string;
  organizationId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: Date;
}

interface NotificationRow {
  id: string;
  organization_id: string;
  title: string;
  message: string;
  type: NotificationType;
  is_read: boolean;
  created_at: Date;
}

function toRecord(row: NotificationRow): NotificationRecord {
  return {
    id: row.id,
    organizationId: row.organization_id,
    title: row.title,
    message: row.message,
    type: row.type,
    isRead: row.is_read,
    createdAt: row.created_at,
  };
}

export class NotificationRepository {
  async create(
    client: PoolClient,
    input: { organizationId: string; title: string; message: string; type: NotificationType },
  ): Promise<NotificationRecord> {
    const result = await client.query<NotificationRow>(
      `INSERT INTO notifications (organization_id, title, message, type)
       VALUES ($1, $2, $3, $4)
       RETURNING id, organization_id, title, message, type, is_read, created_at`,
      [input.organizationId, input.title, input.message, input.type],
    );
    return toRecord(result.rows[0]);
  }

  async list(client: PoolClient, organizationId: string): Promise<NotificationRecord[]> {
    const result = await client.query<NotificationRow>(
      `SELECT id, organization_id, title, message, type, is_read, created_at
       FROM notifications
       WHERE organization_id = $1
       ORDER BY created_at DESC`,
      [organizationId],
    );
    return result.rows.map(toRecord);
  }
}
