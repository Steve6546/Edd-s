import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/clerk-react";
import { useBackend } from "../lib/backend";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import ChatListItem from "../components/ChatListItem";
import UserSearchResult from "../components/UserSearchResult";
import ChatListSkeleton from "../components/ChatListSkeleton";
import UserListSkeleton from "../components/UserListSkeleton";
import { Search, Users, MessageSquare, UserPlus, Radio } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { usePerformanceTracking } from "@/lib/performance";

export default function ChatsList() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const backend = useBackend();
  const [searchQuery, setSearchQuery] = useState("");
  const perf = usePerformanceTracking();

  const { data: currentUser } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => backend.user.getCurrentUser(),
  });

  const { data: chatsData, isLoading: chatsLoading } = useQuery({
    queryKey: ["chats", searchQuery],
    queryFn: () => backend.chat.list({ search: searchQuery || undefined }),
    refetchInterval: 3000,
    enabled: !!currentUser,
  });

  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ["userSearch", searchQuery],
    queryFn: async () => {
      const trackEnd = perf.trackSearch(searchQuery);
      const results = await backend.user.search({ query: searchQuery });
      trackEnd();
      return results;
    },
    enabled: searchQuery.length > 0 && !!currentUser,
  });

  const handleUserClick = async (otherUserId: string) => {
    try {
      const chat = await backend.chat.create({ otherUserId });
      navigate(`/chat/${chat.id}`);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to create chat",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <SignedOut>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-blue-100 rounded-full">
                  <MessageSquare className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              <CardTitle className="text-2xl">Welcome to Messenger</CardTitle>
              <CardDescription>Sign in to continue to your chats</CardDescription>
            </CardHeader>
            <CardContent>
              <SignInButton mode="modal">
                <Button className="w-full">Sign In</Button>
              </SignInButton>
            </CardContent>
          </Card>
        </div>
      </SignedOut>
      <SignedIn>
        <div className="fixed inset-0 flex flex-col bg-background overflow-hidden">
          <div className="border-b px-4 py-4 flex items-center justify-between bg-card">
            <h1 className="text-2xl font-bold">Chats</h1>
            <div className="flex gap-1 items-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/status")}
                title="Status"
              >
                <Radio className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/search")}
                title="Search Users"
              >
                <Search className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/friend-requests")}
                title="Friend Requests"
              >
                <UserPlus className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/new-group")}
                title="New Group Chat"
              >
                <Users className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/settings")}
                title="Settings"
              >
                <UserButton />
              </Button>
            </div>
          </div>

          <div className="px-4 py-3 border-b bg-background">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 bg-secondary/50 border-none focus-visible:ring-1"
              />
            </div>
          </div>

          <div 
            className="flex-1 overflow-y-auto overflow-x-hidden"
            style={{
              WebkitOverflowScrolling: 'touch',
              touchAction: 'pan-y',
              overscrollBehavior: 'none',
              overscrollBehaviorY: 'none',
            }}
          >
            {searchQuery ? (
              <div>
                {chatsLoading && <ChatListSkeleton />}
                {!chatsLoading && chatsData && chatsData.chats.length > 0 && (
                  <div>
                    <div className="px-4 py-2 text-sm font-medium text-muted-foreground bg-secondary/30">Chats</div>
                    {chatsData.chats.map((chat) => (
                      <ChatListItem
                        key={chat.id}
                        chat={chat}
                        onClick={() => navigate(`/chat/${chat.id}`)}
                      />
                    ))}
                  </div>
                )}
                {searchLoading && <UserListSkeleton />}
                {!searchLoading && searchResults && searchResults.users.length > 0 && (
                  <div>
                    <div className="px-4 py-2 text-sm font-medium text-muted-foreground bg-secondary/30">
                      {chatsData && chatsData.chats.length > 0 ? "Find New Users" : "Users"}
                    </div>
                    {searchResults.users.map((user) => (
                      <UserSearchResult
                        key={user.id}
                        user={user}
                        onClick={() => handleUserClick(user.id)}
                      />
                    ))}
                  </div>
                )}
                {!chatsLoading && !searchLoading && (!chatsData || chatsData.chats.length === 0) && (!searchResults || searchResults.users.length === 0) && (
                  <div className="p-12 text-center text-muted-foreground">No results found</div>
                )}
              </div>
            ) : chatsLoading ? (
              <ChatListSkeleton />
            ) : chatsData && chatsData.chats.length > 0 ? (
              <div>
                {chatsData.chats.map((chat) => (
                  <ChatListItem
                    key={chat.id}
                    chat={chat}
                    onClick={() => navigate(`/chat/${chat.id}`)}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <div className="w-20 h-20 mb-4 rounded-full bg-secondary/50 flex items-center justify-center">
                  <MessageSquare className="w-10 h-10 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground text-lg">No chats yet</p>
                <p className="text-sm text-muted-foreground mt-1">Tap the search icon to find users</p>
              </div>
            )}
          </div>
        </div>
      </SignedIn>
    </>
  );
}
