import { Topic } from "encore.dev/pubsub";

export interface NewMessageEvent {
  chatId: string;
  message: {
    id: string;
    chatId: string;
    senderId: string;
    content: string;
    fileUrl?: string;
    createdAt: Date;
  };
}

export const newMessageTopic = new Topic<NewMessageEvent>("new-message", {
  deliveryGuarantee: "at-least-once",
});
