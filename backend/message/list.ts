import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { Query } from "encore.dev/api";
import db from "../db";

interface ListMessagesRequest {
  chatId: string;
  limit?: Query<number>;
  before?: Query<string>;
}

interface ReplyToMessage {
  id: string;
  senderId: string;
  senderDisplayName: string;
  content: string;
}

interface MessageWithSender {
  id: string;
  chatId: string;
  senderId: string;
  senderUsername: string;
  senderDisplayName: string;
  senderProfilePictureUrl?: string;
  content: string;
  fileUrl?: string;
  createdAt: Date;
  editedAt?: Date;
  deletedForEveryone: boolean;
  deletedByMe: boolean;
  isSystemMessage: boolean;
  replyTo?: ReplyToMessage;
  mentions: string[];
}

interface ListMessagesResponse {
  messages: MessageWithSender[];
}

export const list = api<ListMessagesRequest, ListMessagesResponse>(
  { auth: true, expose: true, method: "GET", path: "/messages/chat/:chatId" },
  async ({ chatId, limit = 50, before }) => {
    const auth = getAuthData()!;
    const userId = auth.userID;
    let messages: MessageWithSender[];

    let rawMessages: any[];
    if (before) {
      const beforeDate = new Date(before);
      rawMessages = await db.queryAll<any>`
        SELECT 
          m.id,
          m.chat_id as "chatId",
          m.sender_id as "senderId",
          u.username as "senderUsername",
          u.display_name as "senderDisplayName",
          u.profile_picture_url as "senderProfilePictureUrl",
          m.content,
          m.file_url as "fileUrl",
          m.created_at as "createdAt",
          m.edited_at as "editedAt",
          m.deleted_for_everyone as "deletedForEveryone",
          m.is_system_message as "isSystemMessage",
          m.reply_to_message_id as "replyToMessageId",
          EXISTS(SELECT 1 FROM message_deletions WHERE message_id = m.id AND user_id = ${userId}) as "deletedByMe"
        FROM messages m
        INNER JOIN users u ON m.sender_id = u.id
        WHERE m.chat_id = ${chatId} AND m.created_at < ${beforeDate}
        ORDER BY m.created_at DESC
        LIMIT ${limit}
      `;
    } else {
      rawMessages = await db.queryAll<any>`
        SELECT 
          m.id,
          m.chat_id as "chatId",
          m.sender_id as "senderId",
          u.username as "senderUsername",
          u.display_name as "senderDisplayName",
          u.profile_picture_url as "senderProfilePictureUrl",
          m.content,
          m.file_url as "fileUrl",
          m.created_at as "createdAt",
          m.edited_at as "editedAt",
          m.deleted_for_everyone as "deletedForEveryone",
          m.is_system_message as "isSystemMessage",
          m.reply_to_message_id as "replyToMessageId",
          EXISTS(SELECT 1 FROM message_deletions WHERE message_id = m.id AND user_id = ${userId}) as "deletedByMe"
        FROM messages m
        INNER JOIN users u ON m.sender_id = u.id
        WHERE m.chat_id = ${chatId}
        ORDER BY m.created_at DESC
        LIMIT ${limit}
      `;
    }

    messages = [];
    for (const msg of rawMessages) {
      let replyTo: ReplyToMessage | undefined;
      if (msg.replyToMessageId) {
        const replyMsg = await db.queryRow<any>`
          SELECT 
            m.id,
            m.sender_id as "senderId",
            u.display_name as "senderDisplayName",
            m.content
          FROM messages m
          INNER JOIN users u ON m.sender_id = u.id
          WHERE m.id = ${msg.replyToMessageId}
        `;
        if (replyMsg) {
          replyTo = replyMsg;
        }
      }

      const mentionRows = await db.queryAll<{ mentionedUserId: string }>`
        SELECT mentioned_user_id as "mentionedUserId"
        FROM message_mentions
        WHERE message_id = ${msg.id}
      `;

      const message: MessageWithSender = {
        id: msg.id,
        chatId: msg.chatId,
        senderId: msg.senderId,
        senderUsername: msg.senderUsername,
        senderDisplayName: msg.senderDisplayName,
        senderProfilePictureUrl: msg.senderProfilePictureUrl,
        content: msg.content,
        fileUrl: msg.fileUrl,
        createdAt: msg.createdAt,
        editedAt: msg.editedAt,
        deletedForEveryone: msg.deletedForEveryone,
        deletedByMe: msg.deletedByMe,
        isSystemMessage: msg.isSystemMessage,
        replyTo,
        mentions: mentionRows.map(r => r.mentionedUserId),
      };

      messages.push(message);
    }

    return { messages };
  }
);
