import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";

interface SearchUsersRequest {
  query: string;
}

interface UserResult {
  id: string;
  username: string;
  displayName: string;
  profilePictureUrl?: string;
}

interface SearchUsersResponse {
  users: UserResult[];
}

export const search = api<SearchUsersRequest, SearchUsersResponse>(
  { auth: true, expose: true, method: "GET", path: "/users/search" },
  async ({ query }) => {
    const auth = getAuthData()!;
    const searchPattern = `%${query}%`;
    const rows = await db.queryAll<UserResult>`
      SELECT id, username, display_name as "displayName", profile_picture_url as "profilePictureUrl"
      FROM users
      WHERE (username ILIKE ${searchPattern} OR display_name ILIKE ${searchPattern})
        AND id != ${auth.userID}
        AND profile_setup_completed = TRUE
      ORDER BY 
        CASE 
          WHEN LOWER(username) = LOWER(${query}) THEN 1
          WHEN LOWER(username) LIKE LOWER(${query} || '%') THEN 2
          ELSE 3
        END,
        username
      LIMIT 20
    `;
    return { users: rows };
  }
);
