import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Send, Paperclip, X, Mic } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useBackend } from "../lib/backend";
import { cn } from "@/lib/utils";
import VoiceNoteRecorder from "./VoiceNoteRecorder";
import { usePerformanceTracking } from "@/lib/performance";

interface MessageInputProps {
  onSendMessage: (content: string, fileUrl?: string) => void;
  onTyping?: (isTyping: boolean) => void;
  disabled?: boolean;
  replyTo?: any;
  onCancelReply?: () => void;
}

export default function MessageInput({
  onSendMessage,
  onTyping,
  disabled,
  replyTo,
  onCancelReply,
}: MessageInputProps) {
  const backend = useBackend();
  const [message, setMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const { toast } = useToast();
  const typingTimeoutRef = useRef<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const perf = usePerformanceTracking();
  const messageSendTrackerRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const newHeight = Math.min(textareaRef.current.scrollHeight, 120);
      textareaRef.current.style.height = newHeight + 'px';
    }
  }, [message]);



  const handleSend = () => {
    if (message.trim()) {
      const messageId = `temp-${Date.now()}`;
      messageSendTrackerRef.current = perf.trackMessageSend(messageId);
      onSendMessage(message);
      setMessage("");
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
      if (messageSendTrackerRef.current) {
        messageSendTrackerRef.current();
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Maximum file size is 50MB",
        variant: "destructive",
      });
      e.target.value = "";
      return;
    }

    setIsUploading(true);
    try {
      const { uploadUrl, publicUrl } = await backend.message.uploadAttachment({
        fileType: file.type,
        fileName: file.name,
      });

      await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      onSendMessage(file.name, publicUrl);
      toast({
        title: "File uploaded",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to upload file",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const handleVoiceNoteSend = async (audioBlob: Blob, duration: number) => {
    setIsUploading(true);
    try {
      const fileName = `voice-note-${Date.now()}.webm`;
      const { uploadUrl, publicUrl } = await backend.message.uploadAttachment({
        fileType: 'audio/webm',
        fileName,
      });

      await fetch(uploadUrl, {
        method: "PUT",
        body: audioBlob,
        headers: {
          "Content-Type": 'audio/webm',
        },
      });

      onSendMessage(`🎤 Voice note (${formatTime(duration)})`, publicUrl);
      toast({
        title: "Voice note sent",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to send voice note",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setIsRecording(false);
    }
  };

  const handleVoiceNoteCancel = () => {
    setIsRecording(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div 
      className="border-t bg-card shadow-lg flex-shrink-0" 
      style={{
        position: 'sticky',
        bottom: 0,
        zIndex: 10,
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {replyTo && (
        <div className="px-3 sm:px-4 pt-2 sm:pt-3 pb-2 bg-muted/30 border-b flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">Replying to</p>
            <p className="text-sm font-medium truncate">
              {replyTo.senderDisplayName || replyTo.senderUsername}
            </p>
            <p className="text-xs text-muted-foreground truncate">{replyTo.content}</p>
          </div>
          {onCancelReply && (
            <Button variant="ghost" size="icon" onClick={onCancelReply} className="h-7 w-7 sm:h-8 sm:w-8">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}
      
      <div className="p-2 sm:p-3 relative">
        <div className="flex items-end gap-1.5 sm:gap-2 max-w-4xl mx-auto">
          <div className="flex gap-0.5 sm:gap-1">
            <label htmlFor="file-upload">
              <Button
                variant="ghost"
                size="icon"
                disabled={isUploading || disabled || isRecording}
                type="button"
                asChild
                className="h-9 w-9 sm:h-10 sm:w-10"
              >
                <span className="cursor-pointer">
                  <Paperclip className="h-4 w-4 sm:h-5 sm:w-5" />
                </span>
              </Button>
            </label>
            <input
              id="file-upload"
              type="file"
              className="hidden"
              onChange={handleFileUpload}
              accept="image/*,video/*,audio/*,.pdf,.txt,.zip"
            />
          </div>
          
          {!isRecording && (
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                placeholder="Message"
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  if (onTyping) {
                    onTyping(true);
                    if (typingTimeoutRef.current) {
                      clearTimeout(typingTimeoutRef.current);
                    }
                    typingTimeoutRef.current = setTimeout(() => {
                      onTyping(false);
                    }, 1000);
                  }
                }}
                onKeyDown={handleKeyDown}
                disabled={disabled || isUploading}
                rows={1}
                className={cn(
                  "w-full resize-none rounded-3xl bg-secondary/50 border-none px-3 sm:px-4 py-2.5 sm:py-3 text-sm",
                  "focus:outline-none focus:ring-2 focus:ring-primary/20",
                  "placeholder:text-muted-foreground",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "overflow-hidden"
                )}
                style={{
                  minHeight: '40px',
                  maxHeight: '120px',
                  fontSize: '16px',
                }}
              />
            </div>
          )}

          {message.trim() ? (
            <Button
              onClick={handleSend}
              disabled={!message.trim() || disabled || isUploading || isRecording}
              size="icon"
              className="rounded-full h-10 w-10 sm:h-11 sm:w-11 flex-shrink-0"
            >
              <Send className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          ) : (
            <Button
              onClick={() => setIsRecording(true)}
              disabled={disabled || isUploading || isRecording}
              size="icon"
              variant="ghost"
              className="rounded-full h-10 w-10 sm:h-11 sm:w-11 flex-shrink-0"
            >
              <Mic className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          )}
        </div>
        
        {isRecording && (
          <VoiceNoteRecorder 
            onSend={handleVoiceNoteSend}
            onCancel={handleVoiceNoteCancel}
          />
        )}
      </div>
    </div>
  );
}
