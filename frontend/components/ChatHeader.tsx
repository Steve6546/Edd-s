import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, Circle, Settings, BellOff, Bell, Info, Phone } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

interface ChatHeaderProps {
  chatTitle: string;
  isGroup: boolean;
  participantCount: number;
  typingText: string;
  isGroupAdmin: boolean;
  onBack: () => void;
  onVoiceCall: () => void;
  onToggleMessageStats: () => void;
  onToggleGroupMembers: () => void;
  onToggleGroupSettings: () => void;
  onMute: (hours?: number) => void;
  onUnmute: () => void;
}

export default function ChatHeader({
  chatTitle,
  isGroup,
  participantCount,
  typingText,
  isGroupAdmin,
  onBack,
  onVoiceCall,
  onToggleMessageStats,
  onToggleGroupMembers,
  onToggleGroupSettings,
  onMute,
  onUnmute,
}: ChatHeaderProps) {
  return (
    <div className="border-b px-3 sm:px-4 py-2.5 sm:py-3 flex items-center gap-2 sm:gap-3 bg-card shadow-sm flex-shrink-0 z-10">
      <Button variant="ghost" size="icon" onClick={onBack} className="h-9 w-9 sm:h-10 sm:w-10">
        <ArrowLeft className="h-5 w-5" />
      </Button>
      <div className="flex-1 min-w-0">
        <h1 className="font-semibold text-base sm:text-lg truncate">{chatTitle}</h1>
        {isGroup && (
          <p className="text-xs sm:text-sm text-muted-foreground">
            {participantCount} participants
          </p>
        )}
        {!isGroup && !typingText && (
          <p className="text-xs text-muted-foreground">last seen recently</p>
        )}
        {typingText && (
          <p className="text-xs sm:text-sm text-primary flex items-center gap-1">
            <Circle className="h-2 w-2 fill-primary animate-pulse" />
            {typingText}
          </p>
        )}
      </div>
      
      {!isGroup && (
        <Button variant="ghost" size="icon" onClick={onVoiceCall} className="h-9 w-9 sm:h-10 sm:w-10">
          <Phone className="h-4 w-4 sm:h-5 sm:w-5" />
        </Button>
      )}
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-9 w-9 sm:h-10 sm:w-10">
            <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Chat Options</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={onToggleMessageStats}>
            <Info className="h-4 w-4 mr-2" />
            Message Stats
          </DropdownMenuItem>

          {isGroup && (
            <>
              <DropdownMenuItem onClick={onToggleGroupMembers}>
                <Users className="h-4 w-4 mr-2" />
                View Members
              </DropdownMenuItem>
              {isGroupAdmin && (
                <DropdownMenuItem onClick={onToggleGroupSettings}>
                  <Settings className="h-4 w-4 mr-2" />
                  Group Settings
                </DropdownMenuItem>
              )}
            </>
          )}

          <DropdownMenuSeparator />
          <DropdownMenuLabel>Mute</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => onMute(1)}>
            <BellOff className="h-4 w-4 mr-2" />
            Mute for 1 hour
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onMute(8)}>
            <BellOff className="h-4 w-4 mr-2" />
            Mute for 8 hours
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onMute(24)}>
            <BellOff className="h-4 w-4 mr-2" />
            Mute for 24 hours
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onMute()}>
            <BellOff className="h-4 w-4 mr-2" />
            Mute always
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onUnmute}>
            <Bell className="h-4 w-4 mr-2" />
            Unmute
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
