import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";

interface GetChatRequest {
  chatId: string;
}

interface Participant {
  id: string;
  username: string;
  displayName: string;
  profilePictureUrl?: string;
  isAdmin: boolean;
}

interface ChatDetails {
  id: string;
  name?: string;
  isGroup: boolean;
  participants: Participant[];
  createdAt: Date;
  description?: string;
  groupImageUrl?: string;
}

export const get = api<GetChatRequest, ChatDetails>(
  { auth: true, expose: true, method: "GET", path: "/chats/:chatId" },
  async ({ chatId }) => {
    const chat = await db.queryRow<any>`
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
      throw APIError.notFound("chat not found");
    }

    const participants = await db.queryAll<Participant>`
      SELECT 
        u.id, 
        u.username, 
        u.display_name as "displayName", 
        u.profile_picture_url as "profilePictureUrl",
        cp.is_admin as "isAdmin"
      FROM chat_participants cp
      INNER JOIN users u ON cp.user_id = u.id
      WHERE cp.chat_id = ${chatId}
    `;

    return {
      id: chat.id,
      name: chat.name,
      isGroup: chat.isGroup,
      participants,
      createdAt: chat.createdAt,
      description: chat.description,
      groupImageUrl: chat.groupImageUrl,
    };
  }
);
