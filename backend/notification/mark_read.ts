import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";

interface MarkReadRequest {
  notificationId: string;
}

interface MarkReadResponse {
  success: boolean;
}

export const markRead = api<MarkReadRequest, MarkReadResponse>(
  { auth: true, expose: true, method: "POST", path: "/notifications/:notificationId/read" },
  async ({ notificationId }) => {
    const auth = getAuthData()!;
    const userId = auth.userID;

    const notification = await db.queryRow<{ userId: string }>`
      SELECT user_id as "userId" FROM notifications WHERE id = ${notificationId}
    `;

    if (!notification) {
      throw APIError.notFound("notification not found");
    }

    if (notification.userId !== userId) {
      throw APIError.permissionDenied("cannot mark another user's notification as read");
    }

    await db.exec`
      UPDATE notifications
      SET is_read = true
      WHERE id = ${notificationId}
    `;

    return { success: true };
  }
);
