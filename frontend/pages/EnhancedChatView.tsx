import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { useBackend } from "../lib/backend";
import MessageInput from "../components/MessageInput";
import ChatHeader from "../components/ChatHeader";
import MessageList from "../components/MessageList";
import ChatSettingsPanels from "../components/ChatSettingsPanels";
import { useToast } from "@/components/ui/use-toast";
import { useCall } from "../contexts/CallContext";
import { StreamReconnectionManager } from "@/lib/reconnection";
import { usePerformanceTracking } from "@/lib/performance";

export default function EnhancedChatView() {
  const { chatId } = useParams<{ chatId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const backend = useBackend();
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [showGroupSettings, setShowGroupSettings] = useState(false);
  const [showGroupMembers, setShowGroupMembers] = useState(false);
  const [showMessageStats, setShowMessageStats] = useState(false);
  const messageStreamManagerRef = useRef<StreamReconnectionManager<any> | null>(null);
  const presenceStreamManagerRef = useRef<StreamReconnectionManager<any> | null>(null);
  const typingTimeoutRef = useRef<any>(null);
  const [replyTo, setReplyTo] = useState<any>(null);
  const messageIdsRef = useRef<Set<string>>(new Set());
  const isComponentMountedRef = useRef(true);
  const { initiateCall } = useCall();
  const perf = usePerformanceTracking();
  const firstMessageTrackedRef = useRef(false);
  const chatLoadEndRef = useRef<(() => void) | null>(null);

  const { data: currentUser } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => backend.user.getCurrentUser(),
  });

  const { data: chatData, isLoading: chatLoading } = useQuery({
    queryKey: ["chat", chatId],
    queryFn: async () => {
      chatLoadEndRef.current = perf.trackChatLoad(chatId!);
      const data = await backend.chat.get({ chatId: chatId! });
      return data;
    },
    enabled: !!chatId,
  });

  const { data: messagesData, isLoading: messagesLoading } = useQuery({
    queryKey: ["messages", chatId],
    queryFn: async () => {
      const trackEnd = perf.trackFirstMessage(chatId!);
      const data = await backend.message.list({ chatId: chatId! });
      if (data.messages.length > 0 && !firstMessageTrackedRef.current) {
        trackEnd();
        firstMessageTrackedRef.current = true;
      }
      return data;
    },
    enabled: !!chatId,
  });

  useEffect(() => {
    if (messagesData) {
      const trackEnd = perf.trackMessageListRender(messagesData.messages.length);
      const reversedMessages = [...messagesData.messages].reverse();
      setMessages(reversedMessages);
      messageIdsRef.current = new Set(reversedMessages.map(m => m.id));
      trackEnd();
      
      if (chatLoadEndRef.current) {
        chatLoadEndRef.current();
        chatLoadEndRef.current = null;
      }
    }
  }, [messagesData, perf]);

  useEffect(() => {
    if (!chatId) return;

    isComponentMountedRef.current = true;

    if (!messageStreamManagerRef.current) {
      messageStreamManagerRef.current = new StreamReconnectionManager(
        () => backend.message.stream({ chatId }),
        {
          initialDelayMs: 1000,
          maxDelayMs: 30000,
          maxAttempts: Infinity,
          backoffMultiplier: 2,
        }
      );

      messageStreamManagerRef.current.onMessage((message) => {
        if (isComponentMountedRef.current && !messageIdsRef.current.has(message.id)) {
          messageIdsRef.current.add(message.id);
          setMessages((prev) => [...prev, message]);
          
          if (!firstMessageTrackedRef.current) {
            perf.recordMetric('time-to-first-message', performance.now(), { chatId });
            firstMessageTrackedRef.current = true;
          }
        }
      });

      messageStreamManagerRef.current.onError((error) => {
        console.error("Message stream error:", error);
      });
    }

    messageStreamManagerRef.current.connect();

    return () => {
      isComponentMountedRef.current = false;
      
      if (messageStreamManagerRef.current) {
        messageStreamManagerRef.current.disconnect();
        messageStreamManagerRef.current = null;
      }
    };
  }, [chatId, backend]);

  useEffect(() => {
    if (!chatId) return;

    isComponentMountedRef.current = true;

    if (!presenceStreamManagerRef.current) {
      presenceStreamManagerRef.current = new StreamReconnectionManager(
        () => backend.presence.stream({ chatId }),
        {
          initialDelayMs: 1000,
          maxDelayMs: 30000,
          maxAttempts: Infinity,
          backoffMultiplier: 2,
        }
      );

      presenceStreamManagerRef.current.onMessage((event) => {
        if (isComponentMountedRef.current && event.type === "typing" && event.userId !== currentUser?.id) {
          if (event.isTyping) {
            setTypingUsers((prev) => new Set(prev).add(event.userId));
          } else {
            setTypingUsers((prev) => {
              const next = new Set(prev);
              next.delete(event.userId);
              return next;
            });
          }
        }
      });

      presenceStreamManagerRef.current.onError((error) => {
        console.error("Presence stream error:", error);
      });
    }

    presenceStreamManagerRef.current.connect();

    return () => {
      isComponentMountedRef.current = false;
      
      if (presenceStreamManagerRef.current) {
        presenceStreamManagerRef.current.disconnect();
        presenceStreamManagerRef.current = null;
      }
    };
  }, [chatId, backend, currentUser]);

  useEffect(() => {
    if (messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      const isScrolledToBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
      if (isScrolledToBottom || messages.length === messagesData?.messages.length) {
        setTimeout(() => {
          container.scrollTop = container.scrollHeight;
        }, 0);
      }
    }
  }, [messages]);

  const sendMessageMutation = useMutation({
    mutationFn: async (data: { content: string; fileUrl?: string; optimisticId?: string }) => {
      const result = await backend.message.send({
        chatId: chatId!,
        content: data.content,
        fileUrl: data.fileUrl,
      });
      return { ...result, optimisticId: data.optimisticId };
    },
    onSuccess: (data) => {
      if (data.optimisticId) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === data.optimisticId ? { ...msg, id: data.id, sending: false } : msg
          )
        );
        messageIdsRef.current.delete(data.optimisticId);
        messageIdsRef.current.add(data.id);
      }
    },
    onError: (error, variables) => {
      console.error(error);
      if (variables.optimisticId) {
        setMessages((prev) => prev.filter((msg) => msg.id !== variables.optimisticId));
        messageIdsRef.current.delete(variables.optimisticId);
      }
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    },
  });

  const editMessageMutation = useMutation({
    mutationFn: ({ messageId, content }: { messageId: string; content: string }) =>
      backend.message.edit({ messageId, content }),
    onSuccess: (updatedMessage) => {
      setMessages((prev) =>
        prev.map((msg) => (msg.id === updatedMessage.id ? updatedMessage : msg))
      );
      toast({ title: "Message edited" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMessageMutation = useMutation({
    mutationFn: ({ messageId, deleteForEveryone }: { messageId: string; deleteForEveryone: boolean }) =>
      backend.message.deleteMessage({ messageId, deleteForEveryone }),
    onSuccess: (_, variables) => {
      if (variables.deleteForEveryone) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === variables.messageId
              ? { ...msg, deletedForEveryone: true, content: "This message was deleted" }
              : msg
          )
        );
      } else {
        setMessages((prev) => prev.filter((msg) => msg.id !== variables.messageId));
      }
      toast({ title: "Message deleted" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleSendMessage = (content: string, fileUrl?: string) => {
    const optimisticId = `optimistic-${Date.now()}-${Math.random()}`;
    const optimisticMessage = {
      id: optimisticId,
      content,
      fileUrl,
      senderId: currentUser?.id,
      senderDisplayName: currentUser?.displayName,
      senderUsername: currentUser?.username,
      senderProfilePictureUrl: currentUser?.profilePictureUrl,
      createdAt: new Date(),
      deletedForEveryone: false,
      deletedByMe: false,
      sending: true,
    };
    
    messageIdsRef.current.add(optimisticId);
    setMessages((prev) => [...prev, optimisticMessage]);
    sendMessageMutation.mutate({ content, fileUrl, optimisticId });
    handleTyping(false);
    setReplyTo(null);
  };

  const handleEditMessage = (messageId: string, newContent: string) => {
    editMessageMutation.mutate({ messageId, content: newContent });
  };

  const handleDeleteMessage = (messageId: string, deleteForEveryone: boolean) => {
    deleteMessageMutation.mutate({ messageId, deleteForEveryone });
  };

  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({ title: "Copied to clipboard" });
  };

  const handleReplyMessage = (message: any) => {
    setReplyTo(message);
  };

  const muteChatMutation = useMutation({
    mutationFn: ({ isMuted, muteUntil }: { isMuted: boolean; muteUntil?: Date }) =>
      backend.chat.muteChat({ chatId: chatId!, isMuted, muteUntil }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chats"] });
      toast({ title: "Mute settings updated" });
    },
    onError: (error) => {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to update mute settings",
        variant: "destructive",
      });
    },
  });

  const handleMute = (hours?: number) => {
    if (hours) {
      const muteUntil = new Date();
      muteUntil.setHours(muteUntil.getHours() + hours);
      muteChatMutation.mutate({ isMuted: true, muteUntil });
    } else {
      muteChatMutation.mutate({ isMuted: true });
    }
  };

  const handleUnmute = () => {
    muteChatMutation.mutate({ isMuted: false });
  };

  const handleTyping = async (isTyping: boolean) => {
    if (!chatId) return;

    try {
      await backend.presence.updateTyping({ chatId, isTyping });
    } catch (err) {
      console.error("Typing update error:", err);
    }

    if (isTyping) {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        handleTyping(false);
      }, 3000);
    }
  };

  const getChatTitle = () => {
    if (!chatData || !currentUser) return "";
    if (chatData.isGroup) return chatData.name || "Group Chat";
    const otherParticipant = chatData.participants.find((p) => p.id !== currentUser.id);
    return otherParticipant?.displayName || otherParticipant?.username || "Chat";
  };

  const getTypingText = () => {
    if (typingUsers.size === 0) return "";
    if (!chatData) return "";

    const typingUsernames = Array.from(typingUsers)
      .map((userId) => {
        const user = chatData.participants.find((p) => p.id === userId);
        return user?.displayName || user?.username || "Someone";
      })
      .slice(0, 3);

    if (typingUsernames.length === 1) {
      return `${typingUsernames[0]} is typing...`;
    } else if (typingUsernames.length === 2) {
      return `${typingUsernames[0]} and ${typingUsernames[1]} are typing...`;
    } else {
      return `${typingUsernames[0]}, ${typingUsernames[1]} and others are typing...`;
    }
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
    } else {
      toast({
        title: "Cannot make call",
        description: "Voice calls are only available for direct chats",
        variant: "destructive",
      });
    }
  };

  const currentUserParticipant = chatData?.participants.find(p => p.id === currentUser?.id);
  const isGroupAdmin = currentUserParticipant?.isAdmin || false;

  return (
    <div className="fixed inset-0 flex flex-col bg-background overflow-hidden">
      <ChatHeader
        chatTitle={getChatTitle()}
        isGroup={chatData?.isGroup || false}
        participantCount={chatData?.participants.length || 0}
        typingText={getTypingText()}
        isGroupAdmin={isGroupAdmin}
        onBack={() => navigate("/")}
        onVoiceCall={handleVoiceCall}
        onToggleMessageStats={() => setShowMessageStats(!showMessageStats)}
        onToggleGroupMembers={() => setShowGroupMembers(!showGroupMembers)}
        onToggleGroupSettings={() => setShowGroupSettings(!showGroupSettings)}
        onMute={handleMute}
        onUnmute={handleUnmute}
      />

      {chatId && (
        <ChatSettingsPanels
          chatId={chatId}
          currentUserId={currentUser?.id}
          showMessageStats={showMessageStats}
          showGroupSettings={showGroupSettings}
          showGroupMembers={showGroupMembers}
          isGroup={chatData?.isGroup || false}
          isGroupAdmin={isGroupAdmin}
          groupName={chatData?.name}
          groupDescription={chatData?.description}
          groupImageUrl={chatData?.groupImageUrl}
          onCloseGroupSettings={() => setShowGroupSettings(false)}
        />
      )}

      <MessageList
        ref={messagesContainerRef}
        messages={messages}
        currentUserId={currentUser?.id}
        isGroupChat={chatData?.isGroup || false}
        onEdit={handleEditMessage}
        onDelete={handleDeleteMessage}
        onCopy={handleCopyMessage}
        onReply={handleReplyMessage}
        isLoading={messagesLoading}
      />

      <div className="flex-shrink-0">
        <MessageInput
          onSendMessage={handleSendMessage}
          onTyping={handleTyping}
          disabled={sendMessageMutation.isPending}
          replyTo={replyTo}
          onCancelReply={() => setReplyTo(null)}
        />
      </div>
    </div>
  );
}
