import { formatDistanceToNow } from "date-fns";
import { Bell, BellOff } from "lucide-react";

interface ChatListItemProps {
  chat: {
    id: string;
    name?: string;
    isGroup: boolean;
    lastMessage?: string;
    lastMessageTime?: Date;
    lastMessageSenderId?: string;
    lastMessageSenderName?: string;
    otherParticipant?: {
      id: string;
      username: string;
      displayName: string;
      profilePictureUrl?: string;
    };
    participantCount?: number;
    unreadCount: number;
    isMuted: boolean;
    muteUntil?: Date;
    groupImageUrl?: string;
  };
  onClick: () => void;
}

export default function ChatListItem({ chat, onClick }: ChatListItemProps) {
  const getChatName = () => {
    if (chat.isGroup) return chat.name || "Group Chat";
    return chat.otherParticipant?.displayName || chat.otherParticipant?.username || "Unknown";
  };

  const getAvatar = () => {
    if (chat.isGroup) {
      if (chat.groupImageUrl) {
        return (
          <img
            src={chat.groupImageUrl}
            alt={getChatName()}
            className="w-12 h-12 rounded-full object-cover"
          />
        );
      }
      return (
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-semibold">
          {chat.name?.charAt(0).toUpperCase() || "G"}
        </div>
      );
    }

    if (chat.otherParticipant?.profilePictureUrl) {
      return (
        <img
          src={chat.otherParticipant.profilePictureUrl}
          alt={getChatName()}
          className="w-12 h-12 rounded-full object-cover"
        />
      );
    }

    const initial = chat.otherParticipant?.displayName?.charAt(0).toUpperCase() || "?";
    return (
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-indigo-400 flex items-center justify-center text-white font-semibold">
        {initial}
      </div>
    );
  };

  const formatTime = (date?: Date) => {
    if (!date) return "";
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true });
    } catch {
      return "";
    }
  };

  const getLastMessagePreview = () => {
    if (!chat.lastMessage) return "";
    
    if (chat.isGroup && chat.lastMessageSenderName) {
      return `${chat.lastMessageSenderName}: ${chat.lastMessage}`;
    }
    
    return chat.lastMessage;
  };

  return (
    <div
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-3 hover:bg-accent cursor-pointer transition-colors border-b border-border/50 last:border-0"
    >
      <div className="relative">
        {getAvatar()}
        {chat.unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
            <span className="text-xs font-bold text-white">{chat.unreadCount > 9 ? "9+" : chat.unreadCount}</span>
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-2 min-w-0">
            <p className={`truncate text-base ${chat.unreadCount > 0 ? "font-bold" : "font-semibold"}`}>
              {getChatName()}
            </p>
            {chat.isMuted && (
              <BellOff className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            )}
          </div>
          {chat.lastMessageTime && (
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {formatTime(chat.lastMessageTime)}
            </span>
          )}
        </div>
        {chat.lastMessage && (
          <p className={`text-sm truncate ${chat.unreadCount > 0 ? "font-medium text-foreground" : "text-muted-foreground"}`}>
            {getLastMessagePreview()}
          </p>
        )}
      </div>
    </div>
  );
}
