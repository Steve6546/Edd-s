import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";

interface UpdateMemberRoleRequest {
  chatId: string;
  userId: string;
  isAdmin: boolean;
}

interface UpdateMemberRoleResponse {
  success: boolean;
}

export const updateMemberRole = api<UpdateMemberRoleRequest, UpdateMemberRoleResponse>(
  { auth: true, expose: true, method: "PATCH", path: "/chats/group/:chatId/members/:userId/role" },
  async ({ chatId, userId: targetUserId, isAdmin }) => {
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
      throw APIError.invalidArgument("not a group chat");
    }

    if (chat.createdBy !== userId) {
      throw APIError.permissionDenied("only the group owner can change member roles");
    }

    if (targetUserId === userId) {
      throw APIError.invalidArgument("cannot change your own role");
    }

    const targetMember = await db.queryRow<{ exists: boolean }>`
      SELECT EXISTS(
        SELECT 1 FROM chat_participants
        WHERE chat_id = ${chatId} AND user_id = ${targetUserId}
      ) as exists
    `;

    if (!targetMember?.exists) {
      throw APIError.notFound("user is not a member of this group");
    }

    await db.exec`
      UPDATE chat_participants
      SET is_admin = ${isAdmin}
      WHERE chat_id = ${chatId} AND user_id = ${targetUserId}
    `;

    return { success: true };
  }
);
