import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";

interface StatusWithUser {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  profilePictureUrl?: string;
  type: string;
  content?: string;
  mediaUrl?: string;
  backgroundColor?: string;
  createdAt: Date;
  expiresAt: Date;
  viewCount: number;
  hasViewed: boolean;
}

interface ListStatusesResponse {
  statuses: StatusWithUser[];
}

export const list = api<void, ListStatusesResponse>(
  { auth: true, expose: true, method: "GET", path: "/statuses" },
  async () => {
    const auth = getAuthData()!;
    const userId = auth.userID;
    const now = new Date();

    const statuses = await db.queryAll<StatusWithUser>`
      SELECT 
        s.id,
        s.user_id as "userId",
        u.username,
        u.display_name as "displayName",
        u.profile_picture_url as "profilePictureUrl",
        s.type,
        s.content,
        s.media_url as "mediaUrl",
        s.background_color as "backgroundColor",
        s.created_at as "createdAt",
        s.expires_at as "expiresAt",
        (SELECT COUNT(*) FROM status_views WHERE status_id = s.id) as "viewCount",
        EXISTS(SELECT 1 FROM status_views WHERE status_id = s.id AND viewer_id = ${userId}) as "hasViewed"
      FROM statuses s
      INNER JOIN users u ON s.user_id = u.id
      WHERE s.expires_at > ${now}
        AND NOT EXISTS(
          SELECT 1 FROM status_privacy 
          WHERE status_id = s.id AND hidden_from_user_id = ${userId}
        )
        AND (
          s.user_id = ${userId}
          OR EXISTS(
            SELECT 1 FROM friendships f
            WHERE (f.user_id1 = ${userId} AND f.user_id2 = s.user_id)
               OR (f.user_id2 = ${userId} AND f.user_id1 = s.user_id)
          )
        )
      ORDER BY s.created_at DESC
    `;

    return { statuses };
  }
);
