import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";

interface FriendRequestWithUser {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: string;
  createdAt: Date;
  user: {
    id: string;
    username: string;
    displayName: string;
    profilePictureUrl?: string;
  };
}

interface ListFriendRequestsResponse {
  incoming: FriendRequestWithUser[];
  outgoing: FriendRequestWithUser[];
}

export const listRequests = api<void, ListFriendRequestsResponse>(
  { auth: true, expose: true, method: "GET", path: "/friend/requests" },
  async () => {
    const auth = getAuthData()!;
    const userId = auth.userID;

    const incomingRows = await db.queryAll<any>`
      SELECT 
        fr.id,
        fr.from_user_id as "fromUserId",
        fr.to_user_id as "toUserId",
        fr.status,
        fr.created_at as "createdAt",
        u.id as "userId",
        u.username,
        u.display_name as "displayName",
        u.profile_picture_url as "profilePictureUrl"
      FROM friend_requests fr
      INNER JOIN users u ON fr.from_user_id = u.id
      WHERE fr.to_user_id = ${userId} AND fr.status = 'pending'
      ORDER BY fr.created_at DESC
    `;

    const outgoingRows = await db.queryAll<any>`
      SELECT 
        fr.id,
        fr.from_user_id as "fromUserId",
        fr.to_user_id as "toUserId",
        fr.status,
        fr.created_at as "createdAt",
        u.id as "userId",
        u.username,
        u.display_name as "displayName",
        u.profile_picture_url as "profilePictureUrl"
      FROM friend_requests fr
      INNER JOIN users u ON fr.to_user_id = u.id
      WHERE fr.from_user_id = ${userId} AND fr.status = 'pending'
      ORDER BY fr.created_at DESC
    `;

    const incoming: FriendRequestWithUser[] = incomingRows.map(row => ({
      id: row.id,
      fromUserId: row.fromUserId,
      toUserId: row.toUserId,
      status: row.status,
      createdAt: row.createdAt,
      user: {
        id: row.userId,
        username: row.username,
        displayName: row.displayName,
        profilePictureUrl: row.profilePictureUrl,
      },
    }));

    const outgoing: FriendRequestWithUser[] = outgoingRows.map(row => ({
      id: row.id,
      fromUserId: row.fromUserId,
      toUserId: row.toUserId,
      status: row.status,
      createdAt: row.createdAt,
      user: {
        id: row.userId,
        username: row.username,
        displayName: row.displayName,
        profilePictureUrl: row.profilePictureUrl,
      },
    }));

    return { incoming, outgoing };
  }
);
