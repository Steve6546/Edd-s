import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";

interface RemoveParticipantRequest {
  chatId: string;
  userId: string;
}

interface RemoveParticipantResponse {
  success: boolean;
}

export const removeParticipant = api<RemoveParticipantRequest, RemoveParticipantResponse>(
  { auth: true, expose: true, method: "DELETE", path: "/chats/:chatId/participants/:userId" },
  async ({ chatId, userId }) => {
    const auth = getAuthData()!;
    const requesterId = auth.userID;

    const chat = await db.queryRow<{ isGroup: boolean }>`
      SELECT is_group as "isGroup" FROM chats WHERE id = ${chatId}
    `;

    if (!chat) {
      throw APIError.notFound("chat not found");
    }

    if (!chat.isGroup) {
      throw APIError.invalidArgument("cannot remove participants from non-group chat");
    }

    if (requesterId !== userId) {
      const requesterIsAdmin = await db.queryRow<{ isAdmin: boolean }>`
        SELECT is_admin as "isAdmin"
        FROM chat_participants
        WHERE chat_id = ${chatId} AND user_id = ${requesterId}
      `;

      if (!requesterIsAdmin?.isAdmin) {
        throw APIError.permissionDenied("only admins can remove other participants");
      }
    }

    await db.exec`
      DELETE FROM chat_participants
      WHERE chat_id = ${chatId} AND user_id = ${userId}
    `;

    return { success: true };
  }
);
