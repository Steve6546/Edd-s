import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";
import { broadcastOnlineStatus } from "./stream";

interface UpdateOnlineStatusRequest {
  isOnline: boolean;
}

interface UpdateOnlineStatusResponse {
  success: boolean;
}

export const updateOnlineStatus = api<UpdateOnlineStatusRequest, UpdateOnlineStatusResponse>(
  { auth: true, expose: true, method: "POST", path: "/presence/online" },
  async ({ isOnline }) => {
    const auth = getAuthData()!;
    const userId = auth.userID;
    const now = new Date();

    if (isOnline) {
      await db.exec`
        UPDATE users
        SET is_online = TRUE, last_seen = ${now}
        WHERE id = ${userId}
      `;
    } else {
      await db.exec`
        UPDATE users
        SET is_online = FALSE, last_seen = ${now}
        WHERE id = ${userId}
      `;
    }

    await broadcastOnlineStatus(userId, isOnline);

    return { success: true };
  }
);
