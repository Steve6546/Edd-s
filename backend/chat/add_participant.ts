import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";

interface AddParticipantRequest {
  chatId: string;
  userId: string;
  isAdmin?: boolean;
}

interface AddParticipantResponse {
  success: boolean;
}

export const addParticipant = api<AddParticipantRequest, AddParticipantResponse>(
  { auth: true, expose: true, method: "POST", path: "/chats/:chatId/participants" },
  async ({ chatId, userId, isAdmin = false }) => {
    const auth = getAuthData()!;
    const requesterId = auth.userID;

    const chat = await db.queryRow<{ isGroup: boolean }>`
      SELECT is_group as "isGroup" FROM chats WHERE id = ${chatId}
    `;

    if (!chat) {
      throw APIError.notFound("chat not found");
    }

    if (!chat.isGroup) {
      throw APIError.invalidArgument("cannot add participants to non-group chat");
    }

    const requesterIsAdmin = await db.queryRow<{ isAdmin: boolean }>`
      SELECT is_admin as "isAdmin"
      FROM chat_participants
      WHERE chat_id = ${chatId} AND user_id = ${requesterId}
    `;

    if (!requesterIsAdmin?.isAdmin) {
      throw APIError.permissionDenied("only admins can add participants");
    }

    const targetUser = await db.queryRow<{ id: string }>`
      SELECT id FROM users WHERE id = ${userId}
    `;

    if (!targetUser) {
      throw APIError.notFound("user not found");
    }

    const now = new Date();

    await db.exec`
      INSERT INTO chat_participants (chat_id, user_id, is_admin, joined_at)
      VALUES (${chatId}, ${userId}, ${isAdmin}, ${now})
      ON CONFLICT (chat_id, user_id) DO NOTHING
    `;

    return { success: true };
  }
);
