import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";
import { broadcastTypingIndicator } from "./stream";

interface UpdateTypingRequest {
  chatId: string;
  isTyping: boolean;
}

interface UpdateTypingResponse {
  success: boolean;
}

export const updateTyping = api<UpdateTypingRequest, UpdateTypingResponse>(
  { auth: true, expose: true, method: "POST", path: "/presence/typing" },
  async ({ chatId, isTyping }) => {
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

    const now = new Date();

    if (isTyping) {
      await db.exec`
        INSERT INTO typing_indicators (chat_id, user_id, last_typed_at)
        VALUES (${chatId}, ${userId}, ${now})
        ON CONFLICT (chat_id, user_id) DO UPDATE SET last_typed_at = ${now}
      `;

      await broadcastTypingIndicator(chatId, userId, true);
    } else {
      await db.exec`
        DELETE FROM typing_indicators
        WHERE chat_id = ${chatId} AND user_id = ${userId}
      `;

      await broadcastTypingIndicator(chatId, userId, false);
    }

    return { success: true };
  }
);
