import { api } from "encore.dev/api";
import { CronJob } from "encore.dev/cron";
import db from "../db";

export const cleanupStatuses = api(
  { expose: false, method: "POST", path: "/internal/cleanup-statuses" },
  async (): Promise<void> => {
    const now = new Date();
    
    await db.exec`
      DELETE FROM statuses
      WHERE expires_at < ${now}
    `;
  }
);

const _ = new CronJob("cleanup-expired-statuses", {
  title: "Cleanup Expired Statuses",
  every: "5m",
  endpoint: cleanupStatuses,
});
