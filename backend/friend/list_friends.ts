import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";

interface Friend {
  id: string;
  username: string;
  displayName: string;
  profilePictureUrl?: string;
  isOnline: boolean;
  lastSeen?: Date;
}

interface ListFriendsResponse {
  friends: Friend[];
}

export const listFriends = api<void, ListFriendsResponse>(
  { auth: true, expose: true, method: "GET", path: "/friends" },
  async () => {
    const auth = getAuthData()!;
    const userId = auth.userID;

    const rows = await db.queryAll<Friend>`
      SELECT 
        u.id,
        u.username,
        u.display_name as "displayName",
        u.profile_picture_url as "profilePictureUrl",
        u.is_online as "isOnline",
        u.last_seen as "lastSeen"
      FROM users u
      INNER JOIN friendships f ON (
        (f.user_id1 = ${userId} AND f.user_id2 = u.id) OR
        (f.user_id2 = ${userId} AND f.user_id1 = u.id)
      )
      ORDER BY u.display_name
    `;

    return { friends: rows };
  }
);
