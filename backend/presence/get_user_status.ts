import { api } from "encore.dev/api";
import db from "../db";

export interface GetUserStatusRequest {
  userId: string;
}

export interface GetUserStatusResponse {
  isOnline: boolean;
  lastSeen?: Date;
}

export const getUserStatus = api<GetUserStatusRequest, GetUserStatusResponse>(
  { auth: true, expose: true, method: "GET", path: "/presence/status/:userId" },
  async ({ userId }) => {
    const user = await db.queryRow<{ isOnline: boolean; lastSeen: Date | null }>`
      SELECT is_online as "isOnline", last_seen as "lastSeen"
      FROM users
      WHERE id = ${userId}
    `;

    if (!user) {
      return { isOnline: false };
    }

    return {
      isOnline: user.isOnline,
      lastSeen: user.lastSeen || undefined,
    };
  }
);
