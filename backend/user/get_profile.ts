import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";

interface GetProfileRequest {
  userId: string;
}

interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  profilePictureUrl?: string;
  bio?: string;
  isOnline: boolean;
  lastSeen?: Date;
}

export const getProfile = api<GetProfileRequest, UserProfile>(
  { auth: true, expose: true, method: "GET", path: "/users/:userId" },
  async ({ userId }) => {
    const user = await db.queryRow<UserProfile>`
      SELECT 
        id, 
        username, 
        display_name as "displayName", 
        profile_picture_url as "profilePictureUrl",
        bio,
        is_online as "isOnline",
        last_seen as "lastSeen"
      FROM users
      WHERE id = ${userId}
    `;

    if (!user) {
      throw APIError.notFound("user not found");
    }

    return user;
  }
);
