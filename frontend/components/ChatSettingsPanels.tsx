import MessageStats from "./MessageStats";
import GroupSettings from "./GroupSettings";
import GroupMembers from "./GroupMembers";

interface ChatSettingsPanelsProps {
  chatId: string;
  currentUserId?: string;
  showMessageStats: boolean;
  showGroupSettings: boolean;
  showGroupMembers: boolean;
  isGroup: boolean;
  isGroupAdmin: boolean;
  groupName?: string;
  groupDescription?: string;
  groupImageUrl?: string;
  onCloseGroupSettings: () => void;
}

export default function ChatSettingsPanels({
  chatId,
  currentUserId,
  showMessageStats,
  showGroupSettings,
  showGroupMembers,
  isGroup,
  isGroupAdmin,
  groupName,
  groupDescription,
  groupImageUrl,
  onCloseGroupSettings,
}: ChatSettingsPanelsProps) {
  return (
    <>
      {showMessageStats && (
        <div className="flex-shrink-0 px-3 sm:px-4 py-2 border-b bg-card">
          <MessageStats chatId={chatId} userId={currentUserId} />
        </div>
      )}

      {showGroupSettings && isGroup && (
        <div className="flex-shrink-0 px-3 sm:px-4 py-2 border-b bg-card">
          <GroupSettings
            chatId={chatId}
            initialName={groupName || ""}
            initialDescription={groupDescription}
            initialGroupImageUrl={groupImageUrl}
            isAdmin={isGroupAdmin}
            onClose={onCloseGroupSettings}
          />
        </div>
      )}

      {showGroupMembers && isGroup && currentUserId && (
        <div className="flex-shrink-0 px-3 sm:px-4 py-2 border-b bg-card max-h-60 overflow-y-auto">
          <GroupMembers chatId={chatId} currentUserId={currentUserId} />
        </div>
      )}
    </>
  );
}
