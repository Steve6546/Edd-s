import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";
import { randomUUID } from "crypto";

interface CreateGroupChatRequest {
  name: string;
  participantIds: string[];
  description?: string;
  groupImageUrl?: string;
}

interface Chat {
  id: string;
  name: string;
  isGroup: boolean;
  createdAt: Date;
  description?: string;
  groupImageUrl?: string;
}

export const createGroup = api<CreateGroupChatRequest, Chat>(
  { auth: true, expose: true, method: "POST", path: "/chats/group" },
  async ({ name, participantIds, description, groupImageUrl }) => {
    const auth = getAuthData()!;
    const userId = auth.userID;
    if (participantIds.length < 2) {
      throw APIError.invalidArgument("group chat must have at least 2 other participants");
    }

    if (!name) {
      throw APIError.invalidArgument("group name is required");
    }

    const chatId = randomUUID();
    await db.exec`
      INSERT INTO chats (id, name, is_group, created_by, description, group_image_url)
      VALUES (${chatId}, ${name}, true, ${userId}, ${description}, ${groupImageUrl})
    `;

    const now = new Date();
    await db.exec`
      INSERT INTO chat_participants (chat_id, user_id, is_admin, joined_at)
      VALUES (${chatId}, ${userId}, true, ${now})
    `;

    for (const participantId of participantIds) {
      await db.exec`
        INSERT INTO chat_participants (chat_id, user_id, is_admin, joined_at)
        VALUES (${chatId}, ${participantId}, false, ${now})
      `;
    }

    const chat = await db.queryRow<Chat>`
      SELECT 
        id, 
        name, 
        is_group as "isGroup", 
        created_at as "createdAt",
        description,
        group_image_url as "groupImageUrl"
      FROM chats
      WHERE id = ${chatId}
    `;

    if (!chat) {
      throw APIError.internal("chat not found");
    }

    return chat;
  }
);
