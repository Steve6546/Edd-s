import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";
import { randomUUID } from "crypto";
import { broadcastNotification } from "../notification/stream";

interface SendFriendRequestRequest {
  toUserId: string;
}

interface FriendRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: string;
  createdAt: Date;
}

export const sendRequest = api<SendFriendRequestRequest, FriendRequest>(
  { auth: true, expose: true, method: "POST", path: "/friend/requests" },
  async ({ toUserId }) => {
    const auth = getAuthData()!;
    const fromUserId = auth.userID;

    if (fromUserId === toUserId) {
      throw APIError.invalidArgument("cannot send friend request to yourself");
    }

    const targetUser = await db.queryRow<{ id: string }>`
      SELECT id FROM users WHERE id = ${toUserId}
    `;

    if (!targetUser) {
      throw APIError.notFound("user not found");
    }

    const existingRequest = await db.queryRow<{ id: string; status: string }>`
      SELECT id, status FROM friend_requests
      WHERE (from_user_id = ${fromUserId} AND to_user_id = ${toUserId})
         OR (from_user_id = ${toUserId} AND to_user_id = ${fromUserId})
    `;

    if (existingRequest) {
      if (existingRequest.status === 'pending') {
        throw APIError.alreadyExists("friend request already exists");
      }
      if (existingRequest.status === 'accepted') {
        throw APIError.alreadyExists("users are already friends");
      }
    }

    const areFriends = await db.queryRow<{ exists: boolean }>`
      SELECT EXISTS(
        SELECT 1 FROM friendships
        WHERE (user_id1 = ${fromUserId} AND user_id2 = ${toUserId})
           OR (user_id1 = ${toUserId} AND user_id2 = ${fromUserId})
      ) as exists
    `;

    if (areFriends?.exists) {
      throw APIError.alreadyExists("users are already friends");
    }

    const requestId = randomUUID();
    const now = new Date();

    await db.exec`
      INSERT INTO friend_requests (id, from_user_id, to_user_id, status, created_at, updated_at)
      VALUES (${requestId}, ${fromUserId}, ${toUserId}, 'pending', ${now}, ${now})
    `;

    const fromUser = await db.queryRow<{ username: string; displayName: string }>`
      SELECT username, display_name as "displayName" FROM users WHERE id = ${fromUserId}
    `;

    const notificationId = randomUUID();
    const notificationMessage = `${fromUser?.displayName || fromUser?.username || 'Someone'} sent you a friend request`;
    await db.exec`
      INSERT INTO notifications (id, user_id, type, title, message, metadata, created_at)
      VALUES (
        ${notificationId},
        ${toUserId},
        'friend_request',
        'New Friend Request',
        ${notificationMessage},
        ${JSON.stringify({ requestId, fromUserId })}::jsonb,
        ${now}
      )
    `;

    await broadcastNotification(toUserId, {
      id: notificationId,
      type: 'friend_request',
      title: 'New Friend Request',
      message: notificationMessage,
      metadata: { requestId, fromUserId },
      createdAt: now,
    });

    const request = await db.queryRow<FriendRequest>`
      SELECT id, from_user_id as "fromUserId", to_user_id as "toUserId", status, created_at as "createdAt"
      FROM friend_requests
      WHERE id = ${requestId}
    `;

    if (!request) {
      throw APIError.internal("failed to create friend request");
    }

    return request;
  }
);
