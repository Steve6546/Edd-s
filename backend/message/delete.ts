import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";

interface DeleteMessageRequest {
  messageId: string;
  deleteForEveryone: boolean;
}

interface DeleteMessageResponse {
  success: boolean;
  deletedForEveryone: boolean;
}

export const deleteMessage = api<DeleteMessageRequest, DeleteMessageResponse>(
  { auth: true, expose: true, method: "DELETE", path: "/messages/:messageId" },
  async ({ messageId, deleteForEveryone }) => {
    const auth = getAuthData()!;
    const userId = auth.userID;

    const message = await db.queryRow<{ senderId: string; createdAt: Date }>`
      SELECT sender_id as "senderId", created_at as "createdAt"
      FROM messages
      WHERE id = ${messageId}
    `;

    if (!message) {
      throw APIError.notFound("message not found");
    }

    const now = new Date();

    if (deleteForEveryone) {
      if (message.senderId !== userId) {
        throw APIError.permissionDenied("you can only delete your own messages for everyone");
      }

      const timeSinceCreation = now.getTime() - message.createdAt.getTime();
      const fifteenMinutesInMs = 15 * 60 * 1000;

      if (timeSinceCreation > fifteenMinutesInMs) {
        throw APIError.invalidArgument("messages can only be deleted for everyone within 15 minutes of sending");
      }

      await db.exec`
        UPDATE messages
        SET deleted_for_everyone = true, deleted_by_sender = true
        WHERE id = ${messageId}
      `;

      return { success: true, deletedForEveryone: true };
    } else {
      await db.exec`
        INSERT INTO message_deletions (message_id, user_id, deleted_at)
        VALUES (${messageId}, ${userId}, ${now})
        ON CONFLICT (message_id, user_id) DO NOTHING
      `;

      if (message.senderId === userId) {
        await db.exec`
          UPDATE messages
          SET deleted_by_sender = true
          WHERE id = ${messageId}
        `;
      }

      return { success: true, deletedForEveryone: false };
    }
  }
);
