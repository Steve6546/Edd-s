import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";

interface MarkAllReadResponse {
  success: boolean;
}

export const markAllRead = api<void, MarkAllReadResponse>(
  { auth: true, expose: true, method: "POST", path: "/notifications/read-all" },
  async () => {
    const auth = getAuthData()!;
    const userId = auth.userID;

    await db.exec`
      UPDATE notifications
      SET is_read = true
      WHERE user_id = ${userId} AND is_read = false
    `;

    return { success: true };
  }
);
