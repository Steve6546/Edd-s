import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";
import { randomUUID } from "crypto";
import { newMessageTopic } from "./pubsub";
import { broadcastMessage } from "./stream";

interface SendMessageRequest {
  chatId: string;
  content: string;
  fileUrl?: string;
  replyToMessageId?: string;
  mentionedUserIds?: string[];
}

interface Message {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  fileUrl?: string;
  createdAt: Date;
  replyToMessageId?: string;
}

export const send = api<SendMessageRequest, Message>(
  { auth: true, expose: true, method: "POST", path: "/messages" },
  async ({ chatId, content, fileUrl, replyToMessageId, mentionedUserIds }) => {
    const auth = getAuthData()!;
    const senderId = auth.userID;
    const isParticipant = await db.queryRow<{ exists: boolean }>`
      SELECT EXISTS(
        SELECT 1 FROM chat_participants
        WHERE chat_id = ${chatId} AND user_id = ${senderId}
      ) as exists
    `;

    if (!isParticipant?.exists) {
      throw APIError.permissionDenied("user is not a participant in this chat");
    }

    if (replyToMessageId) {
      const replyMessage = await db.queryRow<{ exists: boolean }>`
        SELECT EXISTS(
          SELECT 1 FROM messages
          WHERE id = ${replyToMessageId} AND chat_id = ${chatId}
        ) as exists
      `;

      if (!replyMessage?.exists) {
        throw APIError.invalidArgument("reply message not found in this chat");
      }
    }

    const messageId = randomUUID();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);

    await db.exec`
      INSERT INTO messages (id, chat_id, sender_id, content, file_url, created_at, expires_at, reply_to_message_id)
      VALUES (${messageId}, ${chatId}, ${senderId}, ${content}, ${fileUrl}, ${now}, ${expiresAt}, ${replyToMessageId})
    `;

    if (mentionedUserIds && mentionedUserIds.length > 0) {
      for (const mentionedUserId of mentionedUserIds) {
        await db.exec`
          INSERT INTO message_mentions (message_id, mentioned_user_id)
          VALUES (${messageId}, ${mentionedUserId})
        `;
      }
    }

    const message = await db.queryRow<Message>`
      SELECT 
        id, 
        chat_id as "chatId", 
        sender_id as "senderId", 
        content, 
        file_url as "fileUrl", 
        created_at as "createdAt",
        reply_to_message_id as "replyToMessageId"
      FROM messages
      WHERE id = ${messageId}
    `;

    if (!message) {
      throw APIError.internal("message not found");
    }

    const event = {
      chatId,
      message,
    };

    await newMessageTopic.publish(event);
    await broadcastMessage(event);

    return message;
  }
);
