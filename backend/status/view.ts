import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";

interface ViewStatusRequest {
  statusId: string;
}

interface ViewStatusResponse {
  success: boolean;
}

export const view = api<ViewStatusRequest, ViewStatusResponse>(
  { auth: true, expose: true, method: "POST", path: "/statuses/:statusId/view" },
  async ({ statusId }) => {
    const auth = getAuthData()!;
    const userId = auth.userID;

    const status = await db.queryRow<{ userId: string; expiresAt: Date }>`
      SELECT user_id as "userId", expires_at as "expiresAt"
      FROM statuses
      WHERE id = ${statusId}
    `;

    if (!status) {
      throw APIError.notFound("status not found");
    }

    const now = new Date();
    if (status.expiresAt < now) {
      throw APIError.invalidArgument("status has expired");
    }

    const isHidden = await db.queryRow<{ exists: boolean }>`
      SELECT EXISTS(
        SELECT 1 FROM status_privacy
        WHERE status_id = ${statusId} AND hidden_from_user_id = ${userId}
      ) as exists
    `;

    if (isHidden?.exists) {
      throw APIError.permissionDenied("you cannot view this status");
    }

    await db.exec`
      INSERT INTO status_views (status_id, viewer_id, viewed_at)
      VALUES (${statusId}, ${userId}, ${now})
      ON CONFLICT (status_id, viewer_id) DO NOTHING
    `;

    return { success: true };
  }
);
