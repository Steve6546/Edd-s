import { CronJob } from "encore.dev/cron";
import { api } from "encore.dev/api";
import db from "../db";

export const cleanupExpiredMessages = api(
  { method: "POST", path: "/internal/cleanup-messages" },
  async (): Promise<void> => {
    await db.exec`
      DELETE FROM messages
      WHERE expires_at < NOW()
    `;
  }
);

const _ = new CronJob("cleanup-expired-messages", {
  title: "Cleanup Expired Messages",
  schedule: "0 0 * * *",
  endpoint: cleanupExpiredMessages,
});
