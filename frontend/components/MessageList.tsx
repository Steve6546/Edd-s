import { forwardRef } from "react";
import EnhancedMessageBubble from "./EnhancedMessageBubble";
import MessageListSkeleton from "./MessageListSkeleton";

interface MessageListProps {
  messages: any[];
  currentUserId?: string;
  isGroupChat: boolean;
  onEdit: (messageId: string, content: string) => void;
  onDelete: (messageId: string, deleteForEveryone: boolean) => void;
  onCopy: (content: string) => void;
  onReply: (message: any) => void;
  isLoading?: boolean;
}

const MessageList = forwardRef<HTMLDivElement, MessageListProps>(
  ({ messages, currentUserId, isGroupChat, onEdit, onDelete, onCopy, onReply, isLoading }, ref) => {
    if (isLoading) {
      return (
        <div 
          ref={ref}
          className="flex-1 overflow-y-auto overflow-x-hidden px-3 sm:px-4 py-2"
          style={{ 
            WebkitOverflowScrolling: 'touch',
            touchAction: 'pan-y',
            overscrollBehavior: 'none',
            overscrollBehaviorY: 'none',
            position: 'relative'
          }}
        >
          <MessageListSkeleton />
        </div>
      );
    }

    return (
      <div 
        ref={ref}
        className="flex-1 overflow-y-auto overflow-x-hidden px-3 sm:px-4 py-2"
        style={{ 
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-y',
          overscrollBehavior: 'none',
          overscrollBehaviorY: 'none',
          position: 'relative'
        }}
      >
        <div className="space-y-2 max-w-4xl mx-auto py-2 pb-4">
          {messages.map((message) => (
            <EnhancedMessageBubble
              key={message.id}
              message={message}
              isOwn={currentUserId ? message.senderId === currentUserId : false}
              onEdit={onEdit}
              onDelete={onDelete}
              onCopy={onCopy}
              onReply={onReply}
              showSenderAvatar={isGroupChat}
            />
          ))}
        </div>
      </div>
    );
  }
);

MessageList.displayName = "MessageList";

export default MessageList;
