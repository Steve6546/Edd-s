import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";

interface GetPinnedMessagesRequest {
  chatId: string;
}

interface PinnedMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderUsername: string;
  senderDisplayName: string;
  content: string;
  fileUrl?: string;
  createdAt: Date;
  pinnedBy: string;
  pinnedAt: Date;
}

interface GetPinnedMessagesResponse {
  messages: PinnedMessage[];
}

export const getPinnedMessages = api<GetPinnedMessagesRequest, GetPinnedMessagesResponse>(
  { auth: true, expose: true, method: "GET", path: "/chats/:chatId/pinned" },
  async ({ chatId }) => {
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

    const messages = await db.queryAll<PinnedMessage>`
      SELECT 
        m.id,
        m.chat_id as "chatId",
        m.sender_id as "senderId",
        u.username as "senderUsername",
        u.display_name as "senderDisplayName",
        m.content,
        m.file_url as "fileUrl",
        m.created_at as "createdAt",
        pm.pinned_by as "pinnedBy",
        pm.pinned_at as "pinnedAt"
      FROM pinned_messages pm
      INNER JOIN messages m ON pm.message_id = m.id
      INNER JOIN users u ON m.sender_id = u.id
      WHERE pm.chat_id = ${chatId}
      ORDER BY pm.pinned_at DESC
    `;

    return { messages };
  }
);
