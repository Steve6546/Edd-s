import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";

interface UserProfile {
  id: string;
  username: string | null;
  displayName: string;
  profilePictureUrl?: string;
  profileSetupCompleted: boolean;
  avatarLastChanged?: Date;
  displayNameLastChanged?: Date;
  usernameLastChanged?: Date;
}

export const getCurrentUser = api<void, UserProfile>(
  { auth: true, expose: true, method: "GET", path: "/users/me" },
  async () => {
    const auth = getAuthData()!;
    const userId = auth.userID;

    let user = await db.queryRow<UserProfile>`
      SELECT id, username, display_name as "displayName", profile_picture_url as "profilePictureUrl",
             profile_setup_completed as "profileSetupCompleted",
             avatar_last_changed as "avatarLastChanged",
             display_name_last_changed as "displayNameLastChanged",
             username_last_changed as "usernameLastChanged"
      FROM users
      WHERE id = ${userId}
    `;

    if (!user) {
      await db.exec`
        INSERT INTO users (id, username, display_name, profile_picture_url, profile_setup_completed)
        VALUES (${userId}, NULL, ${auth.fullName ?? 'User'}, ${auth.imageUrl}, FALSE)
      `;

      user = await db.queryRow<UserProfile>`
        SELECT id, username, display_name as "displayName", profile_picture_url as "profilePictureUrl",
               profile_setup_completed as "profileSetupCompleted",
               avatar_last_changed as "avatarLastChanged",
               display_name_last_changed as "displayNameLastChanged",
               username_last_changed as "usernameLastChanged"
        FROM users
        WHERE id = ${userId}
      `;
    }

    return user!;
  }
);
