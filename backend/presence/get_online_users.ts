import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";

interface GetOnlineUsersRequest {
  chatId: string;
}

interface OnlineUser {
  userId: string;
  isOnline: boolean;
  lastSeen?: Date;
}

interface GetOnlineUsersResponse {
  users: OnlineUser[];
}

export const getOnlineUsers = api<GetOnlineUsersRequest, GetOnlineUsersResponse>(
  { auth: true, expose: true, method: "GET", path: "/presence/online/:chatId" },
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
      return { users: [] };
    }

    const users = await db.queryAll<OnlineUser>`
      SELECT 
        u.id as "userId",
        u.is_online as "isOnline",
        u.last_seen as "lastSeen"
      FROM users u
      INNER JOIN chat_participants cp ON u.id = cp.user_id
      WHERE cp.chat_id = ${chatId}
    `;

    return { users };
  }
);
