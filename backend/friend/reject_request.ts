import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";

interface RejectFriendRequestRequest {
  requestId: string;
}

interface RejectFriendRequestResponse {
  success: boolean;
}

export const rejectRequest = api<RejectFriendRequestRequest, RejectFriendRequestResponse>(
  { auth: true, expose: true, method: "POST", path: "/friend/requests/:requestId/reject" },
  async ({ requestId }) => {
    const auth = getAuthData()!;
    const userId = auth.userID;

    const request = await db.queryRow<{ toUserId: string; status: string }>`
      SELECT to_user_id as "toUserId", status
      FROM friend_requests
      WHERE id = ${requestId}
    `;

    if (!request) {
      throw APIError.notFound("friend request not found");
    }

    if (request.toUserId !== userId) {
      throw APIError.permissionDenied("you can only reject requests sent to you");
    }

    if (request.status !== 'pending') {
      throw APIError.invalidArgument("request has already been processed");
    }

    const now = new Date();

    await db.exec`
      UPDATE friend_requests
      SET status = 'rejected', updated_at = ${now}
      WHERE id = ${requestId}
    `;

    return { success: true };
  }
);
