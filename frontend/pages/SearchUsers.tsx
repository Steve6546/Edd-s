import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useBackend } from "@/lib/backend";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import UserListSkeleton from "@/components/UserListSkeleton";
import { ArrowLeft, Search, MessageCircle, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function SearchUsers() {
  const navigate = useNavigate();
  const backend = useBackend();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");

  const { data: searchResults, isLoading } = useQuery({
    queryKey: ["search-users", query],
    queryFn: () => backend.user.search({ query }),
    enabled: query.length > 0,
  });

  const createChatMutation = useMutation({
    mutationFn: (otherUserId: string) => backend.chat.create({ otherUserId }),
    onSuccess: (data) => {
      navigate(`/chat/${data.id}`);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  return (
    <div className="flex flex-col h-screen bg-background">
      <div className="flex items-center gap-3 p-4 border-b">
        <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-semibold">Search Users</h1>
      </div>

      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search by @username..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10 h-12 text-base"
            autoFocus
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4">
        {isLoading && <UserListSkeleton />}

        {!isLoading && searchResults?.users && searchResults.users.length > 0 && (
          <div className="divide-y">
            {searchResults.users.map((user) => (
              <div
                key={user.id}
                className="p-4 hover:bg-accent/50 cursor-pointer transition-colors flex items-center justify-between"
                onClick={() => createChatMutation.mutate(user.id)}
              >
                <div className="flex items-center gap-3">
                  <img
                    src={user.profilePictureUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`}
                    alt={user.displayName}
                    className="w-14 h-14 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-semibold text-base">{user.displayName}</p>
                    <p className="text-sm text-muted-foreground">@{user.username}</p>
                  </div>
                </div>
                <Button size="sm" disabled={createChatMutation.isPending}>
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Message
                </Button>
              </div>
            ))}
          </div>
        )}

        {!isLoading && query && (!searchResults?.users || searchResults.users.length === 0) && (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-lg font-medium">User not found</p>
            <p className="text-sm text-muted-foreground mt-1">Try searching with a different username</p>
          </div>
        )}

        {!query && (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">Search for users by username</p>
          </div>
        )}
      </div>
    </div>
  );
}
