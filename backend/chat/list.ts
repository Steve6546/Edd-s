import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { Query } from "encore.dev/api";
import db from "../db";

interface ChatPreview {
  id: string;
  name?: string;
  isGroup: boolean;
  lastMessage?: string;
  lastMessageTime?: Date;
  lastMessageSenderId?: string;
  lastMessageSenderName?: string;
  otherParticipant?: {
    id: string;
    username: string;
    displayName: string;
    profilePictureUrl?: string;
  };
  participantCount?: number;
  unreadCount: number;
  isMuted: boolean;
  muteUntil?: Date;
  groupImageUrl?: string;
}

interface ListChatsRequest {
  search?: Query<string>;
}

interface ListChatsResponse {
  chats: ChatPreview[];
}

export const list = api<ListChatsRequest, ListChatsResponse>(
  { auth: true, expose: true, method: "GET", path: "/chats" },
  async ({ search }) => {
    const auth = getAuthData()!;
    const userId = auth.userID;
    let rows: any[];
    
    if (search) {
      rows = await db.queryAll<any>`
        SELECT 
          c.id,
          c.name,
          c.is_group as "isGroup",
          c.group_image_url as "groupImageUrl",
          m.content as "lastMessage",
          m.created_at as "lastMessageTime",
          m.sender_id as "lastMessageSenderId",
          sender_u.display_name as "lastMessageSenderName",
          cp.is_muted as "isMuted",
          cp.mute_until as "muteUntil",
          cp.last_read_message_id as "lastReadMessageId",
          (
            SELECT COUNT(*)
            FROM chat_participants
            WHERE chat_id = c.id
          ) as "participantCount"
        FROM chats c
        INNER JOIN chat_participants cp ON c.id = cp.chat_id
        LEFT JOIN LATERAL (
          SELECT content, created_at, sender_id
          FROM messages
          WHERE chat_id = c.id AND is_system_message = false
          ORDER BY created_at DESC
          LIMIT 1
        ) m ON true
        LEFT JOIN users sender_u ON m.sender_id = sender_u.id
        WHERE cp.user_id = ${userId} 
          AND (
            c.name ILIKE ${`%${search}%`}
            OR EXISTS (
              SELECT 1 FROM chat_participants cp2
              INNER JOIN users u ON cp2.user_id = u.id
              WHERE cp2.chat_id = c.id 
                AND cp2.user_id != ${userId}
                AND (u.username ILIKE ${`%${search}%`} OR u.display_name ILIKE ${`%${search}%`})
            )
          )
        ORDER BY m.created_at DESC NULLS LAST
      `;
    } else {
      rows = await db.queryAll<any>`
        SELECT 
          c.id,
          c.name,
          c.is_group as "isGroup",
          c.group_image_url as "groupImageUrl",
          m.content as "lastMessage",
          m.created_at as "lastMessageTime",
          m.sender_id as "lastMessageSenderId",
          sender_u.display_name as "lastMessageSenderName",
          cp.is_muted as "isMuted",
          cp.mute_until as "muteUntil",
          cp.last_read_message_id as "lastReadMessageId",
          (
            SELECT COUNT(*)
            FROM chat_participants
            WHERE chat_id = c.id
          ) as "participantCount"
        FROM chats c
        INNER JOIN chat_participants cp ON c.id = cp.chat_id
        LEFT JOIN LATERAL (
          SELECT content, created_at, sender_id
          FROM messages
          WHERE chat_id = c.id AND is_system_message = false
          ORDER BY created_at DESC
          LIMIT 1
        ) m ON true
        LEFT JOIN users sender_u ON m.sender_id = sender_u.id
        WHERE cp.user_id = ${userId}
        ORDER BY m.created_at DESC NULLS LAST
      `;
    }

    const chats: ChatPreview[] = [];
    for (const row of rows) {
      let unreadCount = 0;
      if (row.lastReadMessageId) {
        const unread = await db.queryRow<{ count: number }>`
          SELECT COUNT(*) as count
          FROM messages m
          WHERE m.chat_id = ${row.id}
            AND m.sender_id != ${userId}
            AND m.created_at > (
              SELECT created_at FROM messages WHERE id = ${row.lastReadMessageId}
            )
            AND NOT EXISTS (
              SELECT 1 FROM message_deletions
              WHERE message_id = m.id AND user_id = ${userId}
            )
        `;
        unreadCount = unread?.count || 0;
      } else {
        const unread = await db.queryRow<{ count: number }>`
          SELECT COUNT(*) as count
          FROM messages m
          WHERE m.chat_id = ${row.id}
            AND m.sender_id != ${userId}
            AND NOT EXISTS (
              SELECT 1 FROM message_deletions
              WHERE message_id = m.id AND user_id = ${userId}
            )
        `;
        unreadCount = unread?.count || 0;
      }

      const isMuted = row.isMuted && (!row.muteUntil || new Date(row.muteUntil) > new Date());

      const chat: ChatPreview = {
        id: row.id,
        name: row.name,
        isGroup: row.isGroup,
        lastMessage: row.lastMessage,
        lastMessageTime: row.lastMessageTime,
        lastMessageSenderId: row.lastMessageSenderId,
        lastMessageSenderName: row.lastMessageSenderName,
        participantCount: row.participantCount,
        unreadCount,
        isMuted,
        muteUntil: row.muteUntil,
        groupImageUrl: row.groupImageUrl,
      };

      if (!row.isGroup) {
        const otherParticipant = await db.queryRow<any>`
          SELECT u.id, u.username, u.display_name as "displayName", u.profile_picture_url as "profilePictureUrl"
          FROM chat_participants cp
          INNER JOIN users u ON cp.user_id = u.id
          WHERE cp.chat_id = ${row.id} AND cp.user_id != ${userId}
        `;

        if (otherParticipant) {
          chat.otherParticipant = otherParticipant;
        }
      }

      chats.push(chat);
    }

    return { chats };
  }
);
