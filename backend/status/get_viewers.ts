import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";

interface GetViewersRequest {
  statusId: string;
}

interface Viewer {
  userId: string;
  username: string;
  displayName: string;
  profilePictureUrl?: string;
  viewedAt: Date;
}

interface GetViewersResponse {
  viewers: Viewer[];
}

export const getViewers = api<GetViewersRequest, GetViewersResponse>(
  { auth: true, expose: true, method: "GET", path: "/statuses/:statusId/viewers" },
  async ({ statusId }) => {
    const auth = getAuthData()!;
    const userId = auth.userID;

    const status = await db.queryRow<{ userId: string }>`
      SELECT user_id as "userId" FROM statuses WHERE id = ${statusId}
    `;

    if (!status) {
      throw APIError.notFound("status not found");
    }

    if (status.userId !== userId) {
      throw APIError.permissionDenied("you can only view your own status viewers");
    }

    const viewers = await db.queryAll<Viewer>`
      SELECT 
        u.id as "userId",
        u.username,
        u.display_name as "displayName",
        u.profile_picture_url as "profilePictureUrl",
        sv.viewed_at as "viewedAt"
      FROM status_views sv
      INNER JOIN users u ON sv.viewer_id = u.id
      WHERE sv.status_id = ${statusId}
      ORDER BY sv.viewed_at DESC
    `;

    return { viewers };
  }
);
