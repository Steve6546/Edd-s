import { api, StreamOut } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { newMessageTopic, NewMessageEvent } from "./pubsub";
import db from "../db";

interface StreamHandshake {
  chatId: string;
}

interface StreamMessage {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  fileUrl?: string;
  createdAt: Date;
}

const activeStreams = new Map<string, Set<StreamOut<StreamMessage>>>();

export const stream = api.streamOut<StreamHandshake, StreamMessage>(
  { auth: true, expose: true, path: "/messages/stream" },
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

export async function broadcastMessage(event: NewMessageEvent) {
  const streams = activeStreams.get(event.chatId);
  if (!streams) return;

  for (const stream of streams) {
    try {
      await stream.send({
        id: event.message.id,
        chatId: event.message.chatId,
        senderId: event.message.senderId,
        content: event.message.content,
        fileUrl: event.message.fileUrl,
        createdAt: event.message.createdAt,
      });
    } catch (err) {
      console.error("Error sending message to stream:", err);
      streams.delete(stream);
    }
  }
}
