import { api, StreamOut } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";

interface PresenceHandshake {
  chatId: string;
}

interface PresenceMessage {
  type: "typing" | "online";
  userId: string;
  isTyping?: boolean;
  isOnline?: boolean;
}

const activeStreams = new Map<string, Set<StreamOut<PresenceMessage>>>();

export const stream = api.streamOut<PresenceHandshake, PresenceMessage>(
  { auth: true, expose: true, path: "/presence/stream" },
  async (handshake, stream) => {
    const auth = getAuthData()!;
    const userId = auth.userID;
    const { chatId } = handshake;

    const isParticipant = await db.queryRow<{ exists: boolean }>`
      SELECT EXISTS(
        SELECT 1 FROM chat_participants
        WHERE chat_id = ${chatId} AND user_id = ${userId}
      ) as exists
    `;

    if (!isParticipant?.exists) {
      await stream.close();
      return;
    }

    if (!activeStreams.has(chatId)) {
      activeStreams.set(chatId, new Set());
    }
    activeStreams.get(chatId)!.add(stream);

    try {
      await new Promise(() => {});
    } finally {
      const streams = activeStreams.get(chatId);
      if (streams) {
        streams.delete(stream);
        if (streams.size === 0) {
          activeStreams.delete(chatId);
        }
      }
    }
  }
);

export async function broadcastTypingIndicator(chatId: string, userId: string, isTyping: boolean) {
  const streams = activeStreams.get(chatId);
  if (!streams) return;

  const message: PresenceMessage = {
    type: "typing",
    userId,
    isTyping,
  };

  for (const stream of streams) {
    try {
      await stream.send(message);
    } catch (err) {
      console.error("Error sending typing indicator to stream:", err);
      streams.delete(stream);
    }
  }
}

export async function broadcastOnlineStatus(userId: string, isOnline: boolean) {
  const message: PresenceMessage = {
    type: "online",
    userId,
    isOnline,
  };

  for (const [chatId, streams] of activeStreams.entries()) {
    const isParticipant = await db.queryRow<{ exists: boolean }>`
      SELECT EXISTS(
        SELECT 1 FROM chat_participants
        WHERE chat_id = ${chatId} AND user_id = ${userId}
      ) as exists
    `;

    if (!isParticipant?.exists) continue;

    for (const stream of streams) {
      try {
        await stream.send(message);
      } catch (err) {
        console.error("Error sending online status to stream:", err);
        streams.delete(stream);
      }
    }
  }
}
