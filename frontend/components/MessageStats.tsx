import { useQuery } from "@tanstack/react-query";
import { useBackend } from "../lib/backend";
import { MessageSquare, TrendingUp } from "lucide-react";

interface MessageStatsProps {
  chatId: string;
  userId?: string;
}

export default function MessageStats({ chatId, userId }: MessageStatsProps) {
  const backend = useBackend();

  const { data: stats } = useQuery({
    queryKey: ["messageStats", chatId, userId],
    queryFn: () => backend.message.getStats({ chatId, userId }),
  });

  if (!stats) return null;

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-xl p-3 max-w-4xl mx-auto">
      <div className="flex items-center justify-around gap-6">
        <div className="flex items-center gap-2">
          <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
            <MessageSquare className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Today</p>
            <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
              {stats.userTodayMessages}
            </p>
          </div>
        </div>
        <div className="h-8 w-px bg-border" />
        <div className="flex items-center gap-2">
          <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-lg">
            <TrendingUp className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
              {stats.userTotalMessages}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
