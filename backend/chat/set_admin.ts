import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";

interface SetAdminRequest {
  chatId: string;
  userId: string;
  isAdmin: boolean;
}

interface SetAdminResponse {
  success: boolean;
}

export const setAdmin = api<SetAdminRequest, SetAdminResponse>(
  { auth: true, expose: true, method: "POST", path: "/chats/:chatId/admin" },
  async ({ chatId, userId, isAdmin }) => {
    const auth = getAuthData()!;
    const requesterId = auth.userID;

    const chat = await db.queryRow<{ isGroup: boolean }>`
      SELECT is_group as "isGroup" FROM chats WHERE id = ${chatId}
    `;

    if (!chat) {
      throw APIError.notFound("chat not found");
    }

    if (!chat.isGroup) {
      throw APIError.invalidArgument("cannot set admin in non-group chat");
    }

    const requesterIsAdmin = await db.queryRow<{ isAdmin: boolean }>`
      SELECT is_admin as "isAdmin"
      FROM chat_participants
      WHERE chat_id = ${chatId} AND user_id = ${requesterId}
    `;

    if (!requesterIsAdmin?.isAdmin) {
      throw APIError.permissionDenied("only admins can change admin status");
    }

    await db.exec`
      UPDATE chat_participants
      SET is_admin = ${isAdmin}
      WHERE chat_id = ${chatId} AND user_id = ${userId}
    `;

    return { success: true };
  }
);
