import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useBackend } from "../lib/backend";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Image as ImageIcon, Save } from "lucide-react";

interface GroupSettingsProps {
  chatId: string;
  initialName: string;
  initialDescription?: string;
  initialGroupImageUrl?: string;
  isAdmin: boolean;
  onClose: () => void;
}

export default function GroupSettings({
  chatId,
  initialName,
  initialDescription,
  initialGroupImageUrl,
  isAdmin,
  onClose,
}: GroupSettingsProps) {
  const backend = useBackend();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription || "");
  const [groupImageUrl, setGroupImageUrl] = useState(initialGroupImageUrl || "");

  const updateMutation = useMutation({
    mutationFn: () =>
      backend.chat.updateGroupSettings({
        chatId,
        name: name !== initialName ? name : undefined,
        description: description !== initialDescription ? description : undefined,
        groupImageUrl: groupImageUrl !== initialGroupImageUrl ? groupImageUrl : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat", chatId] });
      queryClient.invalidateQueries({ queryKey: ["chats"] });
      toast({
        title: "Success",
        description: "Group settings updated",
      });
      onClose();
    },
    onError: (error) => {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to update group settings",
        variant: "destructive",
      });
    },
  });

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          Only admins can change group settings
        </CardContent>
      </Card>
    );
  }

  const hasChanges =
    name !== initialName ||
    description !== initialDescription ||
    groupImageUrl !== initialGroupImageUrl;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Group Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-1 block">Group Name</label>
          <Input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Group name"
            maxLength={50}
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block">Description</label>
          <Input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What's this group about?"
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
            value={groupImageUrl}
            onChange={(e) => setGroupImageUrl(e.target.value)}
            placeholder="https://example.com/image.jpg"
          />
          {groupImageUrl && (
            <div className="mt-2">
              <img
                src={groupImageUrl}
                alt="Group preview"
                className="w-16 h-16 rounded-full object-cover"
                onError={() => setGroupImageUrl(initialGroupImageUrl || "")}
              />
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            onClick={() => updateMutation.mutate()}
            disabled={!hasChanges || updateMutation.isPending || !name.trim()}
            className="flex-1"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
