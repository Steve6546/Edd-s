import { Topic } from "encore.dev/pubsub";

export type CallSignalType = "offer" | "answer" | "ice-candidate" | "call-ended";

export interface CallSignalEvent {
  callId: string;
  fromUserId: string;
  toUserId: string;
  signalType: CallSignalType;
  data?: Record<string, unknown>;
}

export const callSignalTopic = new Topic<CallSignalEvent>("call-signal", {
  deliveryGuarantee: "at-least-once",
});
