import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";

interface UpdateGroupSettingsRequest {
  chatId: string;
  name?: string;
  description?: string;
  groupImageUrl?: string;
}

interface Chat {
  id: string;
  name: string;
  description?: string;
  groupImageUrl?: string;
}

export const updateGroupSettings = api<UpdateGroupSettingsRequest, Chat>(
  { auth: true, expose: true, method: "PATCH", path: "/chats/group/:chatId/settings" },
  async ({ chatId, name, description, groupImageUrl }) => {
    const auth = getAuthData()!;
    const userId = auth.userID;

    const chat = await db.queryRow<{ isGroup: boolean; createdBy: string }>`
      SELECT is_group as "isGroup", created_by as "createdBy"
      FROM chats
      WHERE id = ${chatId}
    `;

    if (!chat) {
      throw APIError.notFound("chat not found");
    }

    if (!chat.isGroup) {
      throw APIError.invalidArgument("can only update group chats");
    }

    const participant = await db.queryRow<{ isAdmin: boolean }>`
      SELECT is_admin as "isAdmin"
      FROM chat_participants
      WHERE chat_id = ${chatId} AND user_id = ${userId}
    `;

    if (!participant) {
      throw APIError.permissionDenied("not a member of this group");
    }

    const isOwner = chat.createdBy === userId;
    if (!isOwner && !participant.isAdmin) {
      throw APIError.permissionDenied("only admins can update group settings");
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (name !== undefined) {
      if (!name.trim()) {
        throw APIError.invalidArgument("group name cannot be empty");
      }
      updates.push("name = $" + (values.length + 1));
      values.push(name);
    }

    if (description !== undefined) {
      updates.push("description = $" + (values.length + 1));
      values.push(description);
    }

    if (groupImageUrl !== undefined) {
      updates.push("group_image_url = $" + (values.length + 1));
      values.push(groupImageUrl);
    }

    if (updates.length === 0) {
      throw APIError.invalidArgument("no updates provided");
    }

    values.push(chatId);
    const query = `
      UPDATE chats
      SET ${updates.join(", ")}
      WHERE id = $${values.length}
    `;

    await db.exec(query as any, ...values);

    const updatedChat = await db.queryRow<Chat>`
      SELECT 
        id, 
        name, 
        description,
        group_image_url as "groupImageUrl"
      FROM chats
      WHERE id = ${chatId}
    `;

    if (!updatedChat) {
      throw APIError.internal("failed to fetch updated chat");
    }

    return updatedChat;
  }
);
