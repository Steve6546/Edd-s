import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";
import { randomUUID } from "crypto";
import { broadcastNotification } from "../notification/stream";

interface AcceptFriendRequestRequest {
  requestId: string;
}

interface AcceptFriendRequestResponse {
  success: boolean;
}

export const acceptRequest = api<AcceptFriendRequestRequest, AcceptFriendRequestResponse>(
  { auth: true, expose: true, method: "POST", path: "/friend/requests/:requestId/accept" },
  async ({ requestId }) => {
    const auth = getAuthData()!;
    const userId = auth.userID;

    const request = await db.queryRow<{ fromUserId: string; toUserId: string; status: string }>`
      SELECT from_user_id as "fromUserId", to_user_id as "toUserId", status
      FROM friend_requests
      WHERE id = ${requestId}
    `;

    if (!request) {
      throw APIError.notFound("friend request not found");
    }

    if (request.toUserId !== userId) {
      throw APIError.permissionDenied("you can only accept requests sent to you");
    }

    if (request.status !== 'pending') {
      throw APIError.invalidArgument("request has already been processed");
    }

    const now = new Date();

    await db.exec`
      UPDATE friend_requests
      SET status = 'accepted', updated_at = ${now}
      WHERE id = ${requestId}
    `;

    const user1 = request.fromUserId < request.toUserId ? request.fromUserId : request.toUserId;
    const user2 = request.fromUserId < request.toUserId ? request.toUserId : request.fromUserId;

    await db.exec`
      INSERT INTO friendships (user_id1, user_id2, created_at)
      VALUES (${user1}, ${user2}, ${now})
      ON CONFLICT (user_id1, user_id2) DO NOTHING
    `;

    const acceptorUser = await db.queryRow<{ username: string; displayName: string }>`
      SELECT username, display_name as "displayName" FROM users WHERE id = ${userId}
    `;

    const notificationId = randomUUID();
    const notificationMessage = `${acceptorUser?.displayName || acceptorUser?.username || 'Someone'} accepted your friend request`;
    await db.exec`
      INSERT INTO notifications (id, user_id, type, title, message, metadata, created_at)
      VALUES (
        ${notificationId},
        ${request.fromUserId},
        'friend_accepted',
        'Friend Request Accepted',
        ${notificationMessage},
        ${JSON.stringify({ acceptedBy: userId })}::jsonb,
        ${now}
      )
    `;

    await broadcastNotification(request.fromUserId, {
      id: notificationId,
      type: 'friend_accepted',
      title: 'Friend Request Accepted',
      message: notificationMessage,
      metadata: { acceptedBy: userId },
      createdAt: now,
    });

    return { success: true };
  }
);
