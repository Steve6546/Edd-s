import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useBackend } from "../lib/backend";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";
import { Crown, Shield, UserMinus, UserPlus } from "lucide-react";

interface GroupMembersProps {
  chatId: string;
  currentUserId: string;
}

export default function GroupMembers({ chatId, currentUserId }: GroupMembersProps) {
  const backend = useBackend();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: membersData } = useQuery({
    queryKey: ["groupMembers", chatId],
    queryFn: () => backend.chat.getGroupMembers({ chatId }),
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, isAdmin }: { userId: string; isAdmin: boolean }) =>
      backend.chat.updateMemberRole({ chatId, userId, isAdmin }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groupMembers", chatId] });
      toast({
        title: "Success",
        description: "Member role updated",
      });
    },
    onError: (error) => {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to update member role",
        variant: "destructive",
      });
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: (userId: string) =>
      backend.chat.removeParticipant({ chatId, userId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groupMembers", chatId] });
      toast({
        title: "Success",
        description: "Member removed from group",
      });
    },
    onError: (error) => {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to remove member",
        variant: "destructive",
      });
    },
  });

  if (!membersData) return null;

  const currentUserMember = membersData.members.find(m => m.id === currentUserId);
  const isOwner = currentUserMember?.isOwner || false;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Group Members ({membersData.totalCount})</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="max-h-[400px]">
          <div className="space-y-2">
            {membersData.members.map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors"
              >
                {member.profilePictureUrl ? (
                  <img
                    src={member.profilePictureUrl}
                    alt={member.displayName}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-400 flex items-center justify-center text-white font-semibold">
                    {member.displayName.charAt(0).toUpperCase()}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">{member.displayName}</p>
                    {member.isOwner && (
                      <Crown className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                    )}
                    {member.isAdmin && !member.isOwner && (
                      <Shield className="h-4 w-4 text-blue-500 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">@{member.username}</p>
                </div>

                {isOwner && member.id !== currentUserId && (
                  <div className="flex gap-1">
                    {!member.isAdmin ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          updateRoleMutation.mutate({ userId: member.id, isAdmin: true })
                        }
                        disabled={updateRoleMutation.isPending}
                      >
                        <UserPlus className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          updateRoleMutation.mutate({ userId: member.id, isAdmin: false })
                        }
                        disabled={updateRoleMutation.isPending}
                      >
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                )}

                {member.id === currentUserId && (
                  <span className="text-xs text-muted-foreground">You</span>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
