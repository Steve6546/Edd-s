import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { useBackend } from "../lib/backend";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import MessageBubble from "../components/MessageBubble";
import MessageInput from "../components/MessageInput";
import { ArrowLeft, Users, Phone, Video } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useCall } from "../contexts/CallContext";
import { StreamReconnectionManager } from "@/lib/reconnection";

export default function ChatView() {
  const { chatId } = useParams<{ chatId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const backend = useBackend();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const streamManagerRef = useRef<StreamReconnectionManager<any> | null>(null);
  const isComponentMountedRef = useRef(true);
  const { initiateCall } = useCall();

  const { data: currentUser } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => backend.user.getCurrentUser(),
  });

  const { data: chatData, isLoading: chatLoading } = useQuery({
    queryKey: ["chat", chatId],
    queryFn: () => backend.chat.get({ chatId: chatId! }),
    enabled: !!chatId,
  });

  const { data: messagesData, isLoading: messagesLoading } = useQuery({
    queryKey: ["messages", chatId],
    queryFn: () => backend.message.list({ chatId: chatId! }),
    enabled: !!chatId,
  });

  useEffect(() => {
    if (messagesData) {
      setMessages([...messagesData.messages].reverse());
    }
  }, [messagesData]);

  useEffect(() => {
    if (!chatId) return;

    isComponentMountedRef.current = true;

    if (!streamManagerRef.current) {
      streamManagerRef.current = new StreamReconnectionManager(
        () => backend.message.stream({ chatId }),
        {
          initialDelayMs: 1000,
          maxDelayMs: 30000,
          maxAttempts: Infinity,
          backoffMultiplier: 2,
        }
      );

      streamManagerRef.current.onMessage((message) => {
        if (isComponentMountedRef.current) {
          setMessages((prev) => [...prev, message]);
        }
      });

      streamManagerRef.current.onError((error) => {
        console.error("Message stream error:", error);
      });
    }

    streamManagerRef.current.connect();

    return () => {
      isComponentMountedRef.current = false;
      
      if (streamManagerRef.current) {
        streamManagerRef.current.disconnect();
        streamManagerRef.current = null;
      }
    };
  }, [chatId, backend]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessageMutation = useMutation({
    mutationFn: (data: { content: string; fileUrl?: string }) =>
      backend.message.send({
        chatId: chatId!,
        content: data.content,
        fileUrl: data.fileUrl,
      }),
    onError: (error) => {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = (content: string, fileUrl?: string) => {
    sendMessageMutation.mutate({ content, fileUrl });
  };

  const getChatTitle = () => {
    if (!chatData || !currentUser) return "";
    if (chatData.isGroup) return chatData.name || "Group Chat";
    const otherParticipant = chatData.participants.find((p) => p.id !== currentUser.id);
    return otherParticipant?.displayName || otherParticipant?.username || "Chat";
  };

  const getOtherParticipantId = () => {
    if (!chatData || !currentUser || chatData.isGroup) return null;
    const otherParticipant = chatData.participants.find((p) => p.id !== currentUser.id);
    return otherParticipant?.id || null;
  };

  const handleVoiceCall = () => {
    const recipientId = getOtherParticipantId();
    if (recipientId) {
      initiateCall(recipientId, "voice");
    }
  };

  const handleVideoCall = () => {
    const recipientId = getOtherParticipantId();
    if (recipientId) {
      initiateCall(recipientId, "video");
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      <div className="border-b px-4 py-3 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="font-semibold">{getChatTitle()}</h1>
          {chatData?.isGroup && (
            <p className="text-sm text-muted-foreground">
              <Users className="inline h-3 w-3 mr-1" />
              {chatData.participants.length} participants
            </p>
          )}
        </div>
        {!chatData?.isGroup && (
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={handleVoiceCall}>
              <Phone className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleVideoCall}>
              <Video className="h-5 w-5" />
            </Button>
          </div>
        )}
      </div>

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isOwn={currentUser ? message.senderId === currentUser.id : false}
            />
          ))}
        </div>
      </ScrollArea>

      <MessageInput
        onSendMessage={handleSendMessage}
        disabled={sendMessageMutation.isPending}
      />
    </div>
  );
}
