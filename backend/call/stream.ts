import { api, StreamOut } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { Subscription } from "encore.dev/pubsub";
import { callSignalTopic, CallSignalEvent } from "./pubsub";

interface CallSignal {
  callId: string;
  fromUserId: string;
  signalType: "offer" | "answer" | "ice-candidate" | "call-ended";
  data?: Record<string, unknown>;
}

const connections = new Map<string, StreamOut<CallSignal>>();

new Subscription(callSignalTopic, "call-signal-stream", {
  handler: async (event: CallSignalEvent) => {
    const stream = connections.get(event.toUserId);
    if (stream) {
      await stream.send({
        callId: event.callId,
        fromUserId: event.fromUserId,
        signalType: event.signalType,
        data: event.data,
      });
    }
  },
});

export const stream = api.streamOut<void, CallSignal>(
  { auth: true, expose: true, path: "/calls/stream" },
  async (handshake, outStream) => {
    const auth = getAuthData()!;
    const userId = auth.userID;

    connections.set(userId, outStream);

    try {
      await new Promise(() => {});
    } finally {
      connections.delete(userId);
    }
  }
);

export type { CallSignal };
