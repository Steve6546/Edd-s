import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";

interface EditMessageRequest {
  messageId: string;
  content: string;
}

interface Message {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  fileUrl?: string;
  createdAt: Date;
  editedAt?: Date;
}

export const edit = api<EditMessageRequest, Message>(
  { auth: true, expose: true, method: "PUT", path: "/messages/:messageId" },
  async ({ messageId, content }) => {
    const auth = getAuthData()!;
    const userId = auth.userID;

    const message = await db.queryRow<{ senderId: string; createdAt: Date; deletedForEveryone: boolean }>`
      SELECT sender_id as "senderId", created_at as "createdAt", deleted_for_everyone as "deletedForEveryone"
      FROM messages
      WHERE id = ${messageId}
    `;

    if (!message) {
      throw APIError.notFound("message not found");
    }

    if (message.senderId !== userId) {
      throw APIError.permissionDenied("you can only edit your own messages");
    }

    if (message.deletedForEveryone) {
      throw APIError.invalidArgument("cannot edit a deleted message");
    }

    const now = new Date();
    const timeSinceCreation = now.getTime() - message.createdAt.getTime();
    const twoMinutesInMs = 2 * 60 * 1000;

    if (timeSinceCreation > twoMinutesInMs) {
      throw APIError.invalidArgument("messages can only be edited within 2 minutes of sending");
    }

    await db.exec`
      UPDATE messages
      SET content = ${content}, edited_at = ${now}
      WHERE id = ${messageId}
    `;

    const updatedMessage = await db.queryRow<Message>`
      SELECT 
        id,
        chat_id as "chatId",
        sender_id as "senderId",
        content,
        file_url as "fileUrl",
        created_at as "createdAt",
        edited_at as "editedAt"
      FROM messages
      WHERE id = ${messageId}
    `;

    if (!updatedMessage) {
      throw APIError.internal("failed to retrieve updated message");
    }

    return updatedMessage;
  }
);
