import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";

interface GetMessageStatsRequest {
  chatId: string;
  userId?: string;
}

interface MessageStats {
  totalMessages: number;
  todayMessages: number;
  userTotalMessages: number;
  userTodayMessages: number;
}

export const getStats = api<GetMessageStatsRequest, MessageStats>(
  { auth: true, expose: true, method: "GET", path: "/messages/stats/:chatId" },
  async ({ chatId, userId: targetUserId }) => {
    const auth = getAuthData()!;
    const userId = targetUserId || auth.userID;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const totalResult = await db.queryRow<{ count: number }>`
      SELECT COUNT(*) as count
      FROM messages
      WHERE chat_id = ${chatId}
        AND deleted_for_everyone = false
        AND is_system_message = false
    `;

    const todayResult = await db.queryRow<{ count: number }>`
      SELECT COUNT(*) as count
      FROM messages
      WHERE chat_id = ${chatId}
        AND deleted_for_everyone = false
        AND is_system_message = false
        AND created_at >= ${today}
    `;

    const userTotalResult = await db.queryRow<{ count: number }>`
      SELECT COUNT(*) as count
      FROM messages
      WHERE chat_id = ${chatId}
        AND sender_id = ${userId}
        AND deleted_for_everyone = false
        AND is_system_message = false
    `;

    const userTodayResult = await db.queryRow<{ count: number }>`
      SELECT COUNT(*) as count
      FROM messages
      WHERE chat_id = ${chatId}
        AND sender_id = ${userId}
        AND deleted_for_everyone = false
        AND is_system_message = false
        AND created_at >= ${today}
    `;

    return {
      totalMessages: totalResult?.count || 0,
      todayMessages: todayResult?.count || 0,
      userTotalMessages: userTotalResult?.count || 0,
      userTodayMessages: userTodayResult?.count || 0,
    };
  }
);
