import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";

interface UnpinMessageRequest {
  chatId: string;
  messageId: string;
}

interface UnpinMessageResponse {
  success: boolean;
}

export const unpinMessage = api<UnpinMessageRequest, UnpinMessageResponse>(
  { auth: true, expose: true, method: "DELETE", path: "/chats/:chatId/pin/:messageId" },
  async ({ chatId, messageId }) => {
    const auth = getAuthData()!;
    const userId = auth.userID;

    const isAdmin = await db.queryRow<{ isAdmin: boolean }>`
      SELECT is_admin as "isAdmin"
      FROM chat_participants
      WHERE chat_id = ${chatId} AND user_id = ${userId}
    `;

    if (!isAdmin?.isAdmin) {
      throw APIError.permissionDenied("only admins can unpin messages");
    }

    await db.exec`
      DELETE FROM pinned_messages
      WHERE chat_id = ${chatId} AND message_id = ${messageId}
    `;

    return { success: true };
  }
);
