import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";

interface MarkMessagesReadRequest {
  chatId: string;
  lastMessageId?: string;
}

interface MarkMessagesReadResponse {
  success: boolean;
}

export const markRead = api<MarkMessagesReadRequest, MarkMessagesReadResponse>(
  { auth: true, expose: true, method: "POST", path: "/messages/:chatId/mark-read" },
  async ({ chatId, lastMessageId }) => {
    const auth = getAuthData()!;
    const userId = auth.userID;

    const isParticipant = await db.queryRow<{ exists: boolean }>`
      SELECT EXISTS(
        SELECT 1 FROM chat_participants
        WHERE chat_id = ${chatId} AND user_id = ${userId}
      ) as exists
    `;

    if (!isParticipant?.exists) {
      throw APIError.permissionDenied("user is not a participant in this chat");
    }

    if (lastMessageId) {
      const message = await db.queryRow<{ exists: boolean }>`
        SELECT EXISTS(
          SELECT 1 FROM messages
          WHERE id = ${lastMessageId} AND chat_id = ${chatId}
        ) as exists
      `;

      if (!message?.exists) {
        throw APIError.invalidArgument("message not found in this chat");
      }

      await db.exec`
        UPDATE chat_participants
        SET last_read_message_id = ${lastMessageId}
        WHERE chat_id = ${chatId} AND user_id = ${userId}
      `;
    }

    return { success: true };
  }
);
