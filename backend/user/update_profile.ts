import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";

interface UpdateProfileRequest {
  displayName?: string;
  profilePictureUrl?: string;
  username?: string;
  bio?: string;
}

interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  profilePictureUrl?: string;
  avatarLastChanged?: Date;
  displayNameLastChanged?: Date;
  usernameLastChanged?: Date;
}

export const updateProfile = api<UpdateProfileRequest, UserProfile>(
  { auth: true, expose: true, method: "PUT", path: "/users/me" },
  async ({ displayName, profilePictureUrl, username, bio }) => {
    const auth = getAuthData()!;
    const userId = auth.userID;
    if (!displayName && !profilePictureUrl && !username && bio === undefined) {
      throw APIError.invalidArgument("at least one field must be provided");
    }

    const currentUser = await db.queryRow<{
      avatarLastChanged?: Date;
      displayNameLastChanged?: Date;
      usernameLastChanged?: Date;
      username: string;
    }>`
      SELECT avatar_last_changed as "avatarLastChanged",
             display_name_last_changed as "displayNameLastChanged",
             username_last_changed as "usernameLastChanged",
             username
      FROM users
      WHERE id = ${userId}
    `;

    if (!currentUser) {
      throw APIError.notFound("user not found");
    }

    const now = new Date();
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;
    const ONE_WEEK_MS = 7 * ONE_DAY_MS;

    if (displayName) {
      if (currentUser.displayNameLastChanged) {
        const timeSinceChange = now.getTime() - currentUser.displayNameLastChanged.getTime();
        if (timeSinceChange < ONE_WEEK_MS) {
          const remainingMs = ONE_WEEK_MS - timeSinceChange;
          const remainingDays = Math.ceil(remainingMs / ONE_DAY_MS);
          throw APIError.failedPrecondition(
            `You can only change your display name once per week. Please wait ${remainingDays} more day(s).`
          );
        }
      }
      await db.exec`
        UPDATE users
        SET display_name = ${displayName}, display_name_last_changed = ${now}
        WHERE id = ${userId}
      `;
    }

    if (profilePictureUrl) {
      if (currentUser.avatarLastChanged) {
        const timeSinceChange = now.getTime() - currentUser.avatarLastChanged.getTime();
        if (timeSinceChange < ONE_WEEK_MS) {
          const remainingMs = ONE_WEEK_MS - timeSinceChange;
          const remainingDays = Math.ceil(remainingMs / ONE_DAY_MS);
          throw APIError.failedPrecondition(
            `You can only change your profile picture once per week. Please wait ${remainingDays} more day(s).`
          );
        }
      }
      await db.exec`
        UPDATE users
        SET profile_picture_url = ${profilePictureUrl}, avatar_last_changed = ${now}
        WHERE id = ${userId}
      `;
    }

    if (username) {
      if (currentUser.usernameLastChanged) {
        const timeSinceChange = now.getTime() - currentUser.usernameLastChanged.getTime();
        if (timeSinceChange < ONE_DAY_MS) {
          const remainingHours = Math.ceil((ONE_DAY_MS - timeSinceChange) / (60 * 60 * 1000));
          throw APIError.failedPrecondition(
            `You can only change your username once per day. Please wait ${remainingHours} more hour(s).`
          );
        }
      }

      if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
        throw APIError.invalidArgument(
          "Username must be 3-20 characters and contain only letters, numbers, and underscores"
        );
      }

      const bannedWords = [
        "sex", "porn", "xxx", "nude", "naked", "nsfw", "fuck", "shit", "dick", "cock", "pussy", "ass",
        "cum", "orgasm", "masturbate", "bitch", "slut", "whore", "rape", "molest", "pedophile",
        "terror", "terrorist", "isis", "alqaeda", "bomb", "kill", "murder", "suicide", "genocide",
        "hitler", "nazi", "kkk", "weapon", "gun", "shoot", "attack", "violence", "death",
        "nigger", "nigga", "faggot", "retard", "cunt", "twat", "kike", "chink", "spic",
        "admin", "official", "staff", "support", "moderator", "tiktok", "instagram", "facebook",
        "youtube", "twitter", "google", "apple", "microsoft", "celebrity", "verified", "vip",
        "taylorswift", "justinbieber", "arianagrande", "selenagomez", "kimkardashian",
        "kyliejenner", "beyonce", "rihanna", "drake", "cristiano", "messi", "trump",
        "biden", "obama", "elonmusk", "billgates", "jeffbezos", "zuckerberg"
      ];

      const lowerUsername = username.toLowerCase();
      if (bannedWords.some(word => lowerUsername.includes(word))) {
        throw APIError.invalidArgument("This username is not allowed");
      }

      const existingUser = await db.queryRow`
        SELECT id FROM users WHERE LOWER(username) = LOWER(${username}) AND id != ${userId}
      `;

      if (existingUser) {
        throw APIError.alreadyExists("This username is already taken");
      }

      await db.exec`
        UPDATE users
        SET username = ${username}, username_last_changed = ${now}
        WHERE id = ${userId}
      `;
    }

    if (bio !== undefined) {
      await db.exec`
        UPDATE users
        SET bio = ${bio}
        WHERE id = ${userId}
      `;
    }

    let user = await db.queryRow<UserProfile>`
      SELECT id, username, display_name as "displayName", profile_picture_url as "profilePictureUrl",
             avatar_last_changed as "avatarLastChanged",
             display_name_last_changed as "displayNameLastChanged",
             username_last_changed as "usernameLastChanged"
      FROM users
      WHERE id = ${userId}
    `;

    if (!user) {
      await db.exec`
        INSERT INTO users (id, username, display_name, profile_picture_url)
        VALUES (${userId}, ${auth.username ?? userId}, ${auth.fullName ?? auth.username ?? userId}, ${auth.imageUrl})
      `;
      user = await db.queryRow<UserProfile>`
        SELECT id, username, display_name as "displayName", profile_picture_url as "profilePictureUrl",
               avatar_last_changed as "avatarLastChanged",
               display_name_last_changed as "displayNameLastChanged",
               username_last_changed as "usernameLastChanged"
        FROM users
        WHERE id = ${userId}
      `;
    }

    if (!user) {
      throw APIError.notFound("user not found");
    }

    return user;
  }
);
