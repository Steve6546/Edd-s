import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import backend from "~backend/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import StatusListSkeleton from "@/components/StatusListSkeleton";
import { ArrowLeft, Plus, Eye, Image, Video, Type } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function StatusView() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [statusType, setStatusType] = useState<"text" | "image" | "video">("text");
  const [content, setContent] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [backgroundColor, setBackgroundColor] = useState("#4f46e5");

  const { data: statuses, isLoading } = useQuery({
    queryKey: ["statuses"],
    queryFn: () => backend.status.list(),
    refetchInterval: 30000,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      backend.status.create({
        type: statusType,
        content: statusType === "text" ? content : undefined,
        mediaUrl: statusType !== "text" ? mediaUrl : undefined,
        backgroundColor: statusType === "text" ? backgroundColor : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["statuses"] });
      setShowCreate(false);
      setContent("");
      setMediaUrl("");
      toast({ title: "Status created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const viewMutation = useMutation({
    mutationFn: (statusId: string) => backend.status.view({ statusId }),
  });

  const handleViewStatus = (statusId: string) => {
    viewMutation.mutate(statusId);
  };

  const groupedStatuses = statuses?.statuses.reduce((acc, status) => {
    if (!acc[status.userId]) {
      acc[status.userId] = {
        user: {
          id: status.userId,
          username: status.username,
          displayName: status.displayName,
          profilePictureUrl: status.profilePictureUrl,
        },
        statuses: [],
      };
    }
    acc[status.userId].statuses.push(status);
    return acc;
  }, {} as Record<string, any>);

  return (
    <div className="flex flex-col h-screen bg-background">
      <div className="flex items-center gap-3 p-4 border-b">
        <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-semibold flex-1">Status</h1>
        <Button size="sm" onClick={() => setShowCreate(!showCreate)}>
          <Plus className="w-4 h-4 mr-1" />
          Create
        </Button>
      </div>

      {showCreate && (
        <Card className="m-4 p-4 space-y-4">
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={statusType === "text" ? "default" : "outline"}
              onClick={() => setStatusType("text")}
            >
              <Type className="w-4 h-4 mr-1" />
              Text
            </Button>
            <Button
              size="sm"
              variant={statusType === "image" ? "default" : "outline"}
              onClick={() => setStatusType("image")}
            >
              <Image className="w-4 h-4 mr-1" />
              Image
            </Button>
            <Button
              size="sm"
              variant={statusType === "video" ? "default" : "outline"}
              onClick={() => setStatusType("video")}
            >
              <Video className="w-4 h-4 mr-1" />
              Video
            </Button>
          </div>

          {statusType === "text" && (
            <>
              <Input
                placeholder="What's on your mind?"
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
              <div className="flex items-center gap-2">
                <span className="text-sm">Background:</span>
                <input
                  type="color"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  className="h-8 w-16 cursor-pointer"
                />
              </div>
            </>
          )}

          {(statusType === "image" || statusType === "video") && (
            <Input
              placeholder="Enter media URL"
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
            />
          )}

          <div className="flex gap-2">
            <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
              Post Status
            </Button>
            <Button variant="outline" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
          </div>
        </Card>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading && <StatusListSkeleton />}

        {!isLoading && groupedStatuses &&
          Object.values(groupedStatuses).map((group: any) => (
            <Card
              key={group.user.id}
              className="p-4 cursor-pointer hover:bg-accent transition-colors"
              onClick={() => handleViewStatus(group.statuses[0].id)}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center relative">
                  {group.user.profilePictureUrl ? (
                    <img
                      src={group.user.profilePictureUrl}
                      alt={group.user.displayName}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-lg font-semibold">
                      {group.user.displayName[0].toUpperCase()}
                    </span>
                  )}
                  {!group.statuses[0].hasViewed && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{group.user.displayName}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(group.statuses[0].createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Eye className="w-4 h-4" />
                  <span className="text-sm">{group.statuses[0].viewCount}</span>
                </div>
              </div>
            </Card>
          ))}

        {!isLoading && (!statuses?.statuses || statuses.statuses.length === 0) && (
          <div className="text-center py-12 text-muted-foreground">
            <p>No statuses to show</p>
          </div>
        )}
      </div>
    </div>
  );
}
