import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";

interface UpdateGroupRequest {
  chatId: string;
  name?: string;
  description?: string;
  groupImageUrl?: string;
}

interface UpdateGroupResponse {
  success: boolean;
}

export const updateGroup = api<UpdateGroupRequest, UpdateGroupResponse>(
  { auth: true, expose: true, method: "PUT", path: "/chats/:chatId" },
  async ({ chatId, name, description, groupImageUrl }) => {
    const auth = getAuthData()!;
    const userId = auth.userID;

    const chat = await db.queryRow<{ isGroup: boolean }>`
      SELECT is_group as "isGroup" FROM chats WHERE id = ${chatId}
    `;

    if (!chat) {
      throw APIError.notFound("chat not found");
    }

    if (!chat.isGroup) {
      throw APIError.invalidArgument("cannot update non-group chat");
    }

    const isAdmin = await db.queryRow<{ isAdmin: boolean }>`
      SELECT is_admin as "isAdmin"
      FROM chat_participants
      WHERE chat_id = ${chatId} AND user_id = ${userId}
    `;

    if (!isAdmin?.isAdmin) {
      throw APIError.permissionDenied("only admins can update group details");
    }

    if (name !== undefined) {
      await db.exec`
        UPDATE chats SET name = ${name} WHERE id = ${chatId}
      `;
    }

    if (description !== undefined) {
      await db.exec`
        UPDATE chats SET description = ${description} WHERE id = ${chatId}
      `;
    }

    if (groupImageUrl !== undefined) {
      await db.exec`
        UPDATE chats SET group_image_url = ${groupImageUrl} WHERE id = ${chatId}
      `;
    }

    return { success: true };
  }
);
