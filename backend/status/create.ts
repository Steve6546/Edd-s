import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";
import { randomUUID } from "crypto";

interface CreateStatusRequest {
  type: "text" | "image" | "video";
  content?: string;
  mediaUrl?: string;
  backgroundColor?: string;
  hideFromUserIds?: string[];
}

interface Status {
  id: string;
  userId: string;
  type: string;
  content?: string;
  mediaUrl?: string;
  backgroundColor?: string;
  createdAt: Date;
  expiresAt: Date;
}

export const create = api<CreateStatusRequest, Status>(
  { auth: true, expose: true, method: "POST", path: "/statuses" },
  async ({ type, content, mediaUrl, backgroundColor, hideFromUserIds = [] }) => {
    const auth = getAuthData()!;
    const userId = auth.userID;

    if (type === "text" && !content) {
      throw APIError.invalidArgument("text status requires content");
    }

    if ((type === "image" || type === "video") && !mediaUrl) {
      throw APIError.invalidArgument(`${type} status requires mediaUrl`);
    }

    const statusId = randomUUID();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    await db.exec`
      INSERT INTO statuses (id, user_id, type, content, media_url, background_color, created_at, expires_at)
      VALUES (${statusId}, ${userId}, ${type}, ${content}, ${mediaUrl}, ${backgroundColor}, ${now}, ${expiresAt})
    `;

    for (const hiddenUserId of hideFromUserIds) {
      await db.exec`
        INSERT INTO status_privacy (status_id, hidden_from_user_id)
        VALUES (${statusId}, ${hiddenUserId})
      `;
    }

    const status = await db.queryRow<Status>`
      SELECT 
        id,
        user_id as "userId",
        type,
        content,
        media_url as "mediaUrl",
        background_color as "backgroundColor",
        created_at as "createdAt",
        expires_at as "expiresAt"
      FROM statuses
      WHERE id = ${statusId}
    `;

    if (!status) {
      throw APIError.internal("failed to create status");
    }

    return status;
  }
);
