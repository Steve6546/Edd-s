import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { callSignalTopic } from "./pubsub";

export interface SendSignalRequest {
  callId: string;
  recipientId: string;
  signalType: "offer" | "answer" | "ice-candidate";
  data: Record<string, unknown>;
}

export interface SendSignalResponse {
  success: boolean;
}

export const signal = api(
  { method: "POST", path: "/calls/signal", expose: true, auth: true },
  async (req: SendSignalRequest): Promise<SendSignalResponse> => {
    const auth = getAuthData()!;
    const userId = auth.userID;

    await callSignalTopic.publish({
      callId: req.callId,
      fromUserId: userId,
      toUserId: req.recipientId,
      signalType: req.signalType,
      data: req.data,
    });

    return { success: true };
  }
);
