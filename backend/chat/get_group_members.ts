import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";

interface GetGroupMembersRequest {
  chatId: string;
}

interface GroupMember {
  id: string;
  username: string;
  displayName: string;
  profilePictureUrl?: string;
  isAdmin: boolean;
  isOwner: boolean;
  joinedAt: Date;
}

interface GetGroupMembersResponse {
  members: GroupMember[];
  totalCount: number;
  createdBy: string;
}

export const getGroupMembers = api<GetGroupMembersRequest, GetGroupMembersResponse>(
  { auth: true, expose: true, method: "GET", path: "/chats/group/:chatId/members" },
  async ({ chatId }) => {
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

    const isMember = await db.queryRow<{ exists: boolean }>`
      SELECT EXISTS(
        SELECT 1 FROM chat_participants
        WHERE chat_id = ${chatId} AND user_id = ${userId}
      ) as exists
    `;

    if (!isMember?.exists) {
      throw APIError.permissionDenied("not a member of this group");
    }

    const members = await db.queryAll<GroupMember>`
      SELECT 
        u.id,
        u.username,
        u.display_name as "displayName",
        u.profile_picture_url as "profilePictureUrl",
        cp.is_admin as "isAdmin",
        (u.id = ${chat.createdBy}) as "isOwner",
        cp.joined_at as "joinedAt"
      FROM chat_participants cp
      INNER JOIN users u ON cp.user_id = u.id
      WHERE cp.chat_id = ${chatId}
      ORDER BY 
        CASE WHEN u.id = ${chat.createdBy} THEN 0 ELSE 1 END,
        cp.is_admin DESC,
        cp.joined_at ASC
    `;

    return {
      members,
      totalCount: members.length,
      createdBy: chat.createdBy,
    };
  }
);
