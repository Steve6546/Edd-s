import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import backend from "~backend/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import UserListSkeleton from "@/components/UserListSkeleton";
import { ArrowLeft, Check, X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function FriendRequests() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: requests, isLoading } = useQuery({
    queryKey: ["friend-requests"],
    queryFn: () => backend.friend.listRequests(),
  });

  const acceptMutation = useMutation({
    mutationFn: (requestId: string) => backend.friend.acceptRequest({ requestId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friend-requests"] });
      queryClient.invalidateQueries({ queryKey: ["friends"] });
      toast({ title: "Friend request accepted" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (requestId: string) => backend.friend.rejectRequest({ requestId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friend-requests"] });
      toast({ title: "Friend request rejected" });
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
        <h1 className="text-xl font-semibold">Friend Requests</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading && <UserListSkeleton />}

        {!isLoading && requests?.incoming && requests.incoming.length > 0 && (
          <div>
            <h2 className="text-sm font-medium text-muted-foreground mb-2">Incoming Requests</h2>
            <div className="space-y-2">
              {requests.incoming.map((request) => (
                <Card key={request.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      {request.user.profilePictureUrl ? (
                        <img
                          src={request.user.profilePictureUrl}
                          alt={request.user.displayName}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-lg font-semibold">
                          {request.user.displayName[0].toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{request.user.displayName}</p>
                      <p className="text-sm text-muted-foreground">@{request.user.username}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => acceptMutation.mutate(request.id)}
                      disabled={acceptMutation.isPending}
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => rejectMutation.mutate(request.id)}
                      disabled={rejectMutation.isPending}
                    >
                      <X className="w-4 h-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {!isLoading && requests?.outgoing && requests.outgoing.length > 0 && (
          <div>
            <h2 className="text-sm font-medium text-muted-foreground mb-2">Outgoing Requests</h2>
            <div className="space-y-2">
              {requests.outgoing.map((request) => (
                <Card key={request.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      {request.user.profilePictureUrl ? (
                        <img
                          src={request.user.profilePictureUrl}
                          alt={request.user.displayName}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-lg font-semibold">
                          {request.user.displayName[0].toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{request.user.displayName}</p>
                      <p className="text-sm text-muted-foreground">@{request.user.username}</p>
                    </div>
                  </div>
                  <span className="text-sm text-muted-foreground">Pending</span>
                </Card>
              ))}
            </div>
          </div>
        )}

        {!isLoading && (!requests?.incoming || requests.incoming.length === 0) &&
          (!requests?.outgoing || requests.outgoing.length === 0) && (
            <div className="text-center py-12 text-muted-foreground">
              <p>No friend requests</p>
            </div>
          )}
      </div>
    </div>
  );
}
