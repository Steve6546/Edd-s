import { useState, useRef } from "react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Trash, Reply, Share2, Check, X, Download, Save, Edit2, MoreVertical, Smile } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import VoiceNotePlayer from "./VoiceNotePlayer";
import ImageViewer from "./ImageViewer";
import VideoPlayer from "./VideoPlayer";
import ReactionPicker from "./ReactionPicker";

interface MessageBubbleProps {
  message: {
    id: string;
    content: string;
    fileUrl?: string;
    createdAt: Date;
    editedAt?: Date;
    deletedForEveryone: boolean;
    deletedByMe: boolean;
    senderDisplayName?: string;
    senderUsername?: string;
    senderProfilePictureUrl?: string;
    reactions?: Record<string, number>;
  };
  isOwn: boolean;
  showSenderAvatar?: boolean;
  onEdit?: (messageId: string, newContent: string) => void;
  onDelete?: (messageId: string, deleteForEveryone: boolean) => void;
  onCopy?: (content: string) => void;
  onReply?: (message: any) => void;
}

export default function EnhancedMessageBubble({ 
  message, 
  isOwn, 
  showSenderAvatar, 
  onEdit, 
  onDelete, 
  onCopy,
  onReply 
}: MessageBubbleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [showMenu, setShowMenu] = useState(false);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [reactions, setReactions] = useState<Record<string, number>>(message.reactions || {});
  const longPressTimerRef = useRef<any>(null);
  const touchStartRef = useRef({ x: 0, y: 0 });
  const { toast } = useToast();

  const isRTL = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(message.content);

  const formatTime = (date: Date) => {
    try {
      return format(new Date(date), "HH:mm");
    } catch {
      return "";
    }
  };

  const canEdit = () => {
    if (!isOwn || message.deletedForEveryone) return false;
    const now = new Date();
    const createdAt = new Date(message.createdAt);
    const diffMs = now.getTime() - createdAt.getTime();
    return diffMs < 2 * 60 * 1000;
  };

  const canDeleteForEveryone = () => {
    if (!isOwn || message.deletedForEveryone) return false;
    const now = new Date();
    const createdAt = new Date(message.createdAt);
    const diffMs = now.getTime() - createdAt.getTime();
    return diffMs < 10 * 60 * 1000;
  };

  const handleSaveEdit = () => {
    if (editContent.trim() && onEdit) {
      onEdit(message.id, editContent);
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setEditContent(message.content);
    setIsEditing(false);
  };

  const handleLongPressStart = (e: React.TouchEvent | React.MouseEvent) => {
    const touch = 'touches' in e ? e.touches[0] : e;
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    
    longPressTimerRef.current = setTimeout(() => {
      setShowMenu(true);
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    }, 500);
  };

  const handleLongPressEnd = (e: React.TouchEvent | React.MouseEvent) => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
  };

  const handleLongPressMove = (e: React.TouchEvent | React.MouseEvent) => {
    const touch = 'touches' in e ? e.touches[0] : e;
    const deltaX = Math.abs(touch.clientX - touchStartRef.current.x);
    const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);
    
    if (deltaX > 10 || deltaY > 10) {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    }
  };

  const handleCopy = () => {
    if (onCopy) {
      onCopy(message.content);
    }
    setShowMenu(false);
  };

  const handleReply = () => {
    if (onReply) {
      onReply(message);
    }
    setShowMenu(false);
  };

  const handleShare = async () => {
    if (navigator.share && message.fileUrl) {
      try {
        await navigator.share({
          text: message.content,
          url: message.fileUrl,
        });
      } catch (err) {
        console.error("Share failed:", err);
      }
    } else if (navigator.share) {
      try {
        await navigator.share({
          text: message.content,
        });
      } catch (err) {
        console.error("Share failed:", err);
      }
    } else if (onCopy) {
      onCopy(message.content);
    }
    setShowMenu(false);
  };

  const handleDownload = async () => {
    if (!message.fileUrl) return;
    
    try {
      const response = await fetch(message.fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = message.content || 'download';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({ title: "Downloaded successfully" });
    } catch (error) {
      console.error("Download error:", error);
      toast({
        title: "Error",
        description: "Failed to download file",
        variant: "destructive",
      });
    }
    setShowMenu(false);
  };

  const handleReact = (emoji: string) => {
    setReactions((prev) => {
      const newReactions = { ...prev };
      if (newReactions[emoji]) {
        newReactions[emoji] += 1;
      } else {
        newReactions[emoji] = 1;
      }
      return newReactions;
    });
    toast({ title: `Reacted with ${emoji}` });
  };

  const isImage = message.fileUrl?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
  const isVideo = message.fileUrl?.match(/\.(mp4|webm|mov)$/i);
  const isAudio = message.fileUrl?.match(/\.(mp3|wav|webm|ogg|m4a)$/i) || message.content.includes('Voice note');

  if (message.deletedForEveryone) {
    return (
      <div className={cn("flex flex-col mb-1", isOwn ? "items-end" : "items-start")}>
        <div className="max-w-[75%] sm:max-w-[70%] rounded-2xl px-3 sm:px-4 py-2 bg-muted/30 italic text-muted-foreground text-xs sm:text-sm">
          <p>🚫 This message was deleted</p>
        </div>
      </div>
    );
  }

  if (message.deletedByMe && !isOwn) {
    return null;
  }

  return (
    <>
      <div 
        className={cn(
          "flex flex-col group mb-1 animate-in fade-in slide-in-from-bottom-2 duration-300",
          isOwn ? "items-end" : "items-start"
        )}
        onTouchStart={handleLongPressStart}
        onTouchEnd={handleLongPressEnd}
        onTouchMove={handleLongPressMove}
        onMouseDown={handleLongPressStart}
        onMouseUp={handleLongPressEnd}
        onMouseMove={handleLongPressMove}
        onContextMenu={(e) => {
          e.preventDefault();
          setShowMenu(true);
        }}
      >
        <div className={cn("flex items-end gap-1.5 sm:gap-2 max-w-[90%] sm:max-w-[85%]", isOwn && "flex-row-reverse")}>
          {!isOwn && showSenderAvatar && (
            <div className="flex-shrink-0 mb-1">
              {message.senderProfilePictureUrl ? (
                <img
                  src={message.senderProfilePictureUrl}
                  alt={message.senderDisplayName || "User"}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover ring-2 ring-background"
                />
              ) : (
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-xs font-semibold ring-2 ring-background">
                  {(message.senderDisplayName || message.senderUsername || "?").charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          )}
          
          <div className={cn("flex flex-col", isOwn ? "items-end" : "items-start")}>
            {!isOwn && showSenderAvatar && (
              <span className="text-[10px] sm:text-xs font-medium text-primary mb-0.5 px-1">
                {message.senderDisplayName || message.senderUsername}
              </span>
            )}
            
            <div
              className={cn(
                "rounded-2xl px-3 sm:px-4 py-2 sm:py-2.5 shadow-md transition-all",
                isOwn 
                  ? "bg-gradient-to-br from-blue-500 to-indigo-500 text-white rounded-br-sm" 
                  : "bg-card border border-border/50 rounded-bl-sm",
                showMenu && "ring-2 ring-primary",
                "relative"
              )}
            >
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowMenu(true)}
                className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-background/80 hover:bg-background opacity-0 group-hover:opacity-100 transition-opacity sm:hidden"
              >
                <MoreVertical className="h-3 w-3" />
              </Button>

              {message.fileUrl && (
                <div className="mb-2">
                  {isImage ? (
                    <img
                      src={message.fileUrl}
                      alt="Attachment"
                      className="rounded-lg max-w-full cursor-pointer hover:opacity-90 transition-opacity"
                      style={{ maxHeight: '250px', maxWidth: '100%', objectFit: 'cover' }}
                      onClick={() => setShowImageViewer(true)}
                    />
                  ) : isVideo ? (
                    <div className="relative">
                      <video
                        src={message.fileUrl}
                        className="rounded-lg max-w-full cursor-pointer"
                        style={{ maxHeight: '250px', maxWidth: '100%' }}
                        onClick={() => setShowVideoPlayer(true)}
                      />
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="bg-black/50 rounded-full p-3 sm:p-4">
                          <div className="w-0 h-0 border-l-[16px] sm:border-l-[20px] border-l-white border-y-[10px] sm:border-y-[12px] border-y-transparent ml-1"></div>
                        </div>
                      </div>
                    </div>
                  ) : isAudio ? (
                    <VoiceNotePlayer audioUrl={message.fileUrl} isOwn={isOwn} />
                  ) : (
                    <a
                      href={message.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn("underline break-all text-xs sm:text-sm", isOwn ? "text-white" : "text-primary")}
                    >
                      📎 {message.content || "Download file"}
                    </a>
                  )}
                </div>
              )}
              
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSaveEdit();
                      }
                      if (e.key === "Escape") handleCancelEdit();
                    }}
                    className="flex-1 bg-white/10 border-white/20 text-sm"
                    autoFocus
                  />
                  <Button size="icon" variant="ghost" onClick={handleSaveEdit} className="h-7 w-7 sm:h-8 sm:w-8">
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={handleCancelEdit} className="h-7 w-7 sm:h-8 sm:w-8">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                !message.fileUrl || (!isImage && !isVideo && !isAudio) ? (
                  <p 
                    className={cn(
                      "break-words whitespace-pre-wrap leading-relaxed text-[13px] sm:text-[15px]",
                      isRTL && "text-right",
                      !isRTL && "text-left"
                    )}
                    dir={isRTL ? "rtl" : "ltr"}
                    style={{ 
                      wordBreak: 'break-word',
                      overflowWrap: 'break-word',
                    }}
                  >
                    {message.content}
                  </p>
                ) : null
              )}
            </div>
            
            <span className={cn(
              "text-[10px] sm:text-xs text-muted-foreground mt-0.5 px-1 flex items-center gap-1",
              isOwn && "flex-row-reverse"
            )}>
              {formatTime(message.createdAt)}
              {message.editedAt && <span className="text-[9px] sm:text-[10px] opacity-70">(edited)</span>}
            </span>
          </div>
        </div>
      </div>

      {showMenu && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" 
          onClick={() => setShowMenu(false)}
        >
          <div 
            className="bg-card border border-border rounded-3xl shadow-2xl overflow-hidden w-full max-w-[280px] sm:max-w-xs animate-in zoom-in-95 duration-200" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3 border-b bg-muted/30">
              <p className="text-xs font-medium text-muted-foreground text-center">Message Options</p>
            </div>
            
            <div className="p-2 space-y-1">
              <Button 
                variant="ghost" 
                className="w-full justify-start h-11 text-sm" 
                onClick={handleCopy}
              >
                <Copy className="h-4 w-4 mr-3" />
                Copy
              </Button>
              
              {onReply && (
                <Button 
                  variant="ghost" 
                  className="w-full justify-start h-11 text-sm" 
                  onClick={handleReply}
                >
                  <Reply className="h-4 w-4 mr-3" />
                  Reply
                </Button>
              )}
              
              <Button 
                variant="ghost" 
                className="w-full justify-start h-11 text-sm" 
                onClick={() => {
                  setShowReactionPicker(true);
                  setShowMenu(false);
                }}
              >
                <Smile className="h-4 w-4 mr-3" />
                React
              </Button>
              
              <Button 
                variant="ghost" 
                className="w-full justify-start h-11 text-sm" 
                onClick={handleShare}
              >
                <Share2 className="h-4 w-4 mr-3" />
                Share
              </Button>

              {message.fileUrl && (
                <Button 
                  variant="ghost" 
                  className="w-full justify-start h-11 text-sm" 
                  onClick={handleDownload}
                >
                  <Download className="h-4 w-4 mr-3" />
                  Download
                </Button>
              )}

              {isOwn && canEdit() && !message.fileUrl && (
                <Button 
                  variant="ghost" 
                  className="w-full justify-start h-11 text-sm" 
                  onClick={() => {
                    setIsEditing(true);
                    setShowMenu(false);
                  }}
                >
                  <Edit2 className="h-4 w-4 mr-3" />
                  Edit
                </Button>
              )}

              {isOwn && onDelete && (
                <>
                  <div className="h-px bg-border my-1" />
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start h-11 text-sm text-destructive hover:text-destructive hover:bg-destructive/10" 
                    onClick={() => {
                      onDelete(message.id, false);
                      setShowMenu(false);
                    }}
                  >
                    <Trash className="h-4 w-4 mr-3" />
                    Delete for me
                  </Button>
                  
                  {canDeleteForEveryone() && (
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start h-11 text-sm text-destructive hover:text-destructive hover:bg-destructive/10" 
                      onClick={() => {
                        onDelete(message.id, true);
                        setShowMenu(false);
                      }}
                    >
                      <Trash className="h-4 w-4 mr-3" />
                      Delete for everyone
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {showImageViewer && isImage && message.fileUrl && (
        <ImageViewer
          imageUrl={message.fileUrl}
          onClose={() => setShowImageViewer(false)}
          onDownload={handleDownload}
          onShare={handleShare}
          onDelete={isOwn && onDelete ? () => {
            onDelete(message.id, false);
            setShowImageViewer(false);
          } : undefined}
          showDelete={isOwn}
        />
      )}

      {showVideoPlayer && isVideo && message.fileUrl && (
        <VideoPlayer
          videoUrl={message.fileUrl}
          onClose={() => setShowVideoPlayer(false)}
          onDownload={handleDownload}
          onShare={handleShare}
          onDelete={isOwn && onDelete ? () => {
            onDelete(message.id, false);
            setShowVideoPlayer(false);
          } : undefined}
          showDelete={isOwn}
        />
      )}
      
      {showReactionPicker && (
        <ReactionPicker
          onReact={handleReact}
          onClose={() => setShowReactionPicker(false)}
        />
      )}
    </>
  );
}
