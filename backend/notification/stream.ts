import { api, StreamOut } from "encore.dev/api";
import { getAuthData } from "~encore/auth";

interface NotificationStreamMessage {
  id: string;
  type: string;
  title: string;
  message: string;
  metadata?: any;
  createdAt: Date;
}

const activeStreams = new Map<string, Set<StreamOut<NotificationStreamMessage>>>();

export const stream = api.streamOut<void, NotificationStreamMessage>(
  { auth: true, expose: true, path: "/notifications/stream" },
  async (handshake, stream) => {
    const auth = getAuthData()!;
    const userId = auth.userID;

    if (!activeStreams.has(userId)) {
      activeStreams.set(userId, new Set());
    }
    activeStreams.get(userId)!.add(stream);

    try {
      await new Promise(() => {});
    } finally {
      const streams = activeStreams.get(userId);
      if (streams) {
        streams.delete(stream);
        if (streams.size === 0) {
          activeStreams.delete(userId);
        }
      }
    }
  }
);

export async function broadcastNotification(userId: string, notification: NotificationStreamMessage) {
  const streams = activeStreams.get(userId);
  if (!streams) return;

  for (const stream of streams) {
    try {
      await stream.send(notification);
    } catch (err) {
      console.error("Error sending notification to stream:", err);
      streams.delete(stream);
    }
  }
}
