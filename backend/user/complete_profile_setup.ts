import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";

export interface CompleteProfileSetupRequest {
  username: string;
  displayName: string;
  profilePictureUrl?: string;
}

export interface CompleteProfileSetupResponse {
  success: boolean;
  error?: string;
}

function isValidUsername(username: string): boolean {
  return /^[a-zA-Z0-9_]{3,20}$/.test(username);
}

export const completeProfileSetup = api<CompleteProfileSetupRequest, CompleteProfileSetupResponse>(
  { auth: true, expose: true, method: "POST", path: "/users/complete-profile" },
  async (req) => {
    const auth = getAuthData()!;
    const { username, displayName, profilePictureUrl } = req;

    if (!isValidUsername(username)) {
      return {
        success: false,
        error: "Invalid username format. Use 3-20 characters (letters, numbers, underscores only).",
      };
    }

    if (!displayName || displayName.trim().length === 0) {
      return {
        success: false,
        error: "Display name is required.",
      };
    }

    const existing = await db.queryRow`
      SELECT id FROM users WHERE LOWER(username) = LOWER(${username}) AND id != ${auth.userID}
    `;

    if (existing) {
      return {
        success: false,
        error: "Username is already taken.",
      };
    }

    await db.exec`
      UPDATE users
      SET username = ${username},
          display_name = ${displayName},
          profile_picture_url = ${profilePictureUrl || null},
          profile_setup_completed = TRUE
      WHERE id = ${auth.userID}
    `;

    return { success: true };
  }
);
