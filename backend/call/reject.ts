import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";
import { callSignalTopic } from "./pubsub";

export interface RejectCallRequest {
  callId: string;
}

export interface RejectCallResponse {
  success: boolean;
}

export const reject = api(
  { method: "POST", path: "/calls/:callId/reject", expose: true, auth: true },
  async (req: RejectCallRequest): Promise<RejectCallResponse> => {
    const auth = getAuthData()!;
    const userId = auth.userID;

    const call = await db.queryRow<{ caller_id: string; recipient_id: string }>`
      UPDATE calls
      SET status = 'rejected', ended_at = NOW()
      WHERE id = ${req.callId}
        AND recipient_id = ${userId}
        AND status = 'ringing'
      RETURNING caller_id, recipient_id
    `;

    if (call) {
      await callSignalTopic.publish({
        callId: req.callId,
        fromUserId: userId,
        toUserId: call.caller_id,
        signalType: "call-ended",
        data: { reason: "rejected" },
      });
    }

    return { success: true };
  }
);
