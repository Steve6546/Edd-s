import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";
import { callSignalTopic } from "./pubsub";

export interface InitiateCallRequest {
  recipientId: string;
  callType: "voice" | "video";
}

export interface InitiateCallResponse {
  callId: string;
  callType: "voice" | "video";
  callerId: string;
  recipientId: string;
  initiatedAt: Date;
}

export const initiate = api(
  { method: "POST", path: "/calls/initiate", expose: true, auth: true },
  async (req: InitiateCallRequest): Promise<InitiateCallResponse> => {
    const auth = getAuthData()!;
    const callerId = auth.userID;

    const result = await db.queryRow<{ id: string; initiated_at: Date }>`
      INSERT INTO calls (caller_id, recipient_id, call_type, status)
      VALUES (${callerId}, ${req.recipientId}, ${req.callType}, 'ringing')
      RETURNING id, initiated_at
    `;

    if (!result) {
      throw new Error("Failed to create call");
    }

    await callSignalTopic.publish({
      callId: result.id,
      fromUserId: callerId,
      toUserId: req.recipientId,
      signalType: "offer",
      data: { callType: req.callType },
    });

    return {
      callId: result.id,
      callType: req.callType,
      callerId,
      recipientId: req.recipientId,
      initiatedAt: result.initiated_at,
    };
  }
);
