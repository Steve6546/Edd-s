import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";

interface MuteChatRequest {
  chatId: string;
  isMuted: boolean;
  muteUntil?: Date;
}

interface MuteChatResponse {
  success: boolean;
}

export const muteChat = api<MuteChatRequest, MuteChatResponse>(
  { auth: true, expose: true, method: "POST", path: "/chats/:chatId/mute" },
  async ({ chatId, isMuted, muteUntil }) => {
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

    await db.exec`
      UPDATE chat_participants
      SET is_muted = ${isMuted}, mute_until = ${muteUntil}
      WHERE chat_id = ${chatId} AND user_id = ${userId}
    `;

    return { success: true };
  }
);
