import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  metadata?: any;
  isRead: boolean;
  createdAt: Date;
}

interface ListNotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
}

export const list = api<void, ListNotificationsResponse>(
  { auth: true, expose: true, method: "GET", path: "/notifications" },
  async () => {
    const auth = getAuthData()!;
    const userId = auth.userID;

    const notifications = await db.queryAll<Notification>`
      SELECT 
        id,
        type,
        title,
        message,
        metadata,
        is_read as "isRead",
        created_at as "createdAt"
      FROM notifications
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT 50
    `;

    const unreadCount = await db.queryRow<{ count: number }>`
      SELECT COUNT(*) as count
      FROM notifications
      WHERE user_id = ${userId} AND is_read = false
    `;

    return {
      notifications,
      unreadCount: unreadCount?.count || 0,
    };
  }
);
