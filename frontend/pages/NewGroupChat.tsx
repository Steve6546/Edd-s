import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useBackend } from "../lib/backend";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, X, Image as ImageIcon, Users as UsersIcon } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function NewGroupChat() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const backend = useBackend();
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [groupImageUrl, setGroupImageUrl] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [selectedUsersData, setSelectedUsersData] = useState<Map<string, any>>(new Map());

  const { data: searchResults } = useQuery({
    queryKey: ["userSearch", searchQuery],
    queryFn: () => backend.user.search({ query: searchQuery }),
    enabled: searchQuery.length > 0,
  });

  const createGroupMutation = useMutation({
    mutationFn: () =>
      backend.chat.createGroup({
        name: groupName,
        participantIds: Array.from(selectedUsers),
        description: groupDescription || undefined,
        groupImageUrl: groupImageUrl || undefined,
      }),
    onSuccess: (data) => {
      navigate(`/chat/${data.id}`);
    },
    onError: (error) => {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to create group chat",
        variant: "destructive",
      });
    },
  });

  const handleToggleUser = (userId: string, userData: any) => {
    const newSelected = new Set(selectedUsers);
    const newData = new Map(selectedUsersData);
    
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
      newData.delete(userId);
    } else {
      newSelected.add(userId);
      newData.set(userId, userData);
    }
    
    setSelectedUsers(newSelected);
    setSelectedUsersData(newData);
  };

  const handleRemoveUser = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    const newData = new Map(selectedUsersData);
    newSelected.delete(userId);
    newData.delete(userId);
    setSelectedUsers(newSelected);
    setSelectedUsersData(newData);
  };

  const handleCreateGroup = () => {
    if (!groupName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a group name",
        variant: "destructive",
      });
      return;
    }
    if (selectedUsers.size < 2) {
      toast({
        title: "Error",
        description: "Please select at least 2 participants",
        variant: "destructive",
      });
      return;
    }
    createGroupMutation.mutate();
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      <div className="border-b px-4 py-3 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-semibold">New Group Chat</h1>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UsersIcon className="h-5 w-5" />
                Group Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Group Name *</label>
                <Input
                  type="text"
                  placeholder="Enter group name"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  maxLength={50}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Description</label>
                <Input
                  type="text"
                  placeholder="What's this group about?"
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                  maxLength={100}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Group Picture URL
                </label>
                <Input
                  type="text"
                  placeholder="https://example.com/image.jpg"
                  value={groupImageUrl}
                  onChange={(e) => setGroupImageUrl(e.target.value)}
                />
                {groupImageUrl && (
                  <div className="mt-2">
                    <img
                      src={groupImageUrl}
                      alt="Group preview"
                      className="w-16 h-16 rounded-full object-cover"
                      onError={() => setGroupImageUrl("")}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {selectedUsers.size > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Selected Members ({selectedUsers.size})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {Array.from(selectedUsersData.entries()).map(([userId, userData]) => (
                    <div
                      key={userId}
                      className="flex items-center gap-2 bg-secondary px-3 py-2 rounded-full"
                    >
                      {userData.profilePictureUrl && (
                        <img
                          src={userData.profilePictureUrl}
                          alt={userData.displayName}
                          className="w-6 h-6 rounded-full object-cover"
                        />
                      )}
                      <span className="text-sm font-medium">{userData.displayName}</span>
                      <button
                        onClick={() => handleRemoveUser(userId)}
                        className="ml-1 hover:bg-background rounded-full p-1"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Add Members</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                type="text"
                placeholder="Search users by name or username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              
              <div className="max-h-[300px] overflow-y-auto">
                {searchResults && searchResults.users.length > 0 ? (
                  <div className="space-y-1">
                    {searchResults.users.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent cursor-pointer transition-colors"
                        onClick={() => handleToggleUser(user.id, user)}
                      >
                        <Checkbox checked={selectedUsers.has(user.id)} />
                        {user.profilePictureUrl && (
                          <img
                            src={user.profilePictureUrl}
                            alt={user.displayName}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{user.displayName}</p>
                          <p className="text-sm text-muted-foreground truncate">@{user.username}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : searchQuery ? (
                  <div className="p-8 text-center text-muted-foreground">No users found</div>
                ) : (
                  <div className="p-8 text-center text-muted-foreground">
                    Search for users to add to the group
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Button
            onClick={handleCreateGroup}
            disabled={createGroupMutation.isPending || selectedUsers.size < 2 || !groupName.trim()}
            className="w-full"
            size="lg"
          >
            Create Group ({selectedUsers.size + 1} members)
          </Button>
        </div>
      </ScrollArea>
    </div>
  );
}
