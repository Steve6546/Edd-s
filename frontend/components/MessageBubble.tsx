import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface MessageBubbleProps {
  message: {
    id: string;
    content: string;
    fileUrl?: string;
    createdAt: Date;
    senderDisplayName?: string;
    senderUsername?: string;
  };
  isOwn: boolean;
}

export default function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  const formatTime = (date: Date) => {
    try {
      return format(new Date(date), "HH:mm");
    } catch {
      return "";
    }
  };

  return (
    <div className={cn("flex flex-col", isOwn ? "items-end" : "items-start")}>
      {!isOwn && (
        <span className="text-xs text-muted-foreground mb-1 px-2">
          {message.senderDisplayName || message.senderUsername}
        </span>
      )}
      <div
        className={cn(
          "max-w-[70%] rounded-2xl px-4 py-2",
          isOwn ? "bg-blue-500 text-white" : "bg-muted"
        )}
      >
        {message.fileUrl && (
          <img
            src={message.fileUrl}
            alt="Attachment"
            className="rounded-lg mb-2 max-w-full"
          />
        )}
        <p className="break-words">{message.content}</p>
      </div>
      <span className="text-xs text-muted-foreground mt-1 px-2">
        {formatTime(message.createdAt)}
      </span>
    </div>
  );
}
