import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";

interface PinMessageRequest {
  chatId: string;
  messageId: string;
}

interface PinMessageResponse {
  success: boolean;
}

export const pinMessage = api<PinMessageRequest, PinMessageResponse>(
  { auth: true, expose: true, method: "POST", path: "/chats/:chatId/pin/:messageId" },
  async ({ chatId, messageId }) => {
    const auth = getAuthData()!;
    const userId = auth.userID;

    const chat = await db.queryRow<{ isGroup: boolean }>`
      SELECT is_group as "isGroup" FROM chats WHERE id = ${chatId}
    `;

    if (!chat) {
      throw APIError.notFound("chat not found");
    }

    if (!chat.isGroup) {
      throw APIError.invalidArgument("cannot pin messages in non-group chat");
    }

    const isAdmin = await db.queryRow<{ isAdmin: boolean }>`
      SELECT is_admin as "isAdmin"
      FROM chat_participants
      WHERE chat_id = ${chatId} AND user_id = ${userId}
    `;

    if (!isAdmin?.isAdmin) {
      throw APIError.permissionDenied("only admins can pin messages");
    }

    const message = await db.queryRow<{ chatId: string }>`
      SELECT chat_id as "chatId" FROM messages WHERE id = ${messageId}
    `;

    if (!message || message.chatId !== chatId) {
      throw APIError.notFound("message not found in this chat");
    }

    const now = new Date();

    await db.exec`
      INSERT INTO pinned_messages (chat_id, message_id, pinned_by, pinned_at)
      VALUES (${chatId}, ${messageId}, ${userId}, ${now})
      ON CONFLICT (chat_id, message_id) DO NOTHING
    `;

    return { success: true };
  }
);
