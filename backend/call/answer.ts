import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";

export interface AnswerCallRequest {
  callId: string;
}

export interface AnswerCallResponse {
  success: boolean;
}

export const answer = api(
  { method: "POST", path: "/calls/:callId/answer", expose: true, auth: true },
  async (req: AnswerCallRequest): Promise<AnswerCallResponse> => {
    const auth = getAuthData()!;
    const userId = auth.userID;

    await db.exec`
      UPDATE calls
      SET status = 'active', answered_at = NOW()
      WHERE id = ${req.callId}
        AND recipient_id = ${userId}
        AND status = 'ringing'
    `;

    return { success: true };
  }
);
