import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";
import { randomUUID } from "crypto";

interface CreateChatRequest {
  otherUserId: string;
}

interface Chat {
  id: string;
  isGroup: boolean;
  createdAt: Date;
}

export const create = api<CreateChatRequest, Chat>(
  { auth: true, expose: true, method: "POST", path: "/chats" },
  async ({ otherUserId }) => {
    const auth = getAuthData()!;
    const userId = auth.userID;
    if (userId === otherUserId) {
      throw APIError.invalidArgument("cannot create chat with yourself");
    }

    const existingChat = await db.queryRow<{ id: string }>`
      SELECT c.id
      FROM chats c
      INNER JOIN chat_participants cp1 ON c.id = cp1.chat_id AND cp1.user_id = ${userId}
      INNER JOIN chat_participants cp2 ON c.id = cp2.chat_id AND cp2.user_id = ${otherUserId}
      WHERE c.is_group = false
    `;

    if (existingChat) {
      const chat = await db.queryRow<Chat>`
        SELECT id, is_group as "isGroup", created_at as "createdAt"
        FROM chats
        WHERE id = ${existingChat.id}
      `;
      if (!chat) {
        throw APIError.internal("chat not found");
      }
      return chat;
    }

    const chatId = randomUUID();
    await db.exec`
      INSERT INTO chats (id, is_group, created_by)
      VALUES (${chatId}, false, ${userId})
    `;

    await db.exec`
      INSERT INTO chat_participants (chat_id, user_id)
      VALUES (${chatId}, ${userId}), (${chatId}, ${otherUserId})
    `;

    const chat = await db.queryRow<Chat>`
      SELECT id, is_group as "isGroup", created_at as "createdAt"
      FROM chats
      WHERE id = ${chatId}
    `;

    if (!chat) {
      throw APIError.internal("chat not found");
    }

    return chat;
  }
);
