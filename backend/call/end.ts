import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";
import { callSignalTopic } from "./pubsub";

export interface EndCallRequest {
  callId: string;
}

export interface EndCallResponse {
  success: boolean;
}

export const end = api(
  { method: "POST", path: "/calls/:callId/end", expose: true, auth: true },
  async (req: EndCallRequest): Promise<EndCallResponse> => {
    const auth = getAuthData()!;
    const userId = auth.userID;

    const call = await db.queryRow<{ caller_id: string; recipient_id: string }>`
      UPDATE calls
      SET status = 'ended', ended_at = NOW()
      WHERE id = ${req.callId}
        AND (caller_id = ${userId} OR recipient_id = ${userId})
        AND status IN ('ringing', 'active')
      RETURNING caller_id, recipient_id
    `;

    if (call) {
      const otherUserId = call.caller_id === userId ? call.recipient_id : call.caller_id;

      await callSignalTopic.publish({
        callId: req.callId,
        fromUserId: userId,
        toUserId: otherUserId,
        signalType: "call-ended",
        data: { reason: "ended" },
      });
    }

    return { success: true };
  }
);
