import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useClerk } from "@clerk/clerk-react";
import { useBackend } from "../lib/backend";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, LogOut, Camera, User, AtSign, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { CooldownTimer } from "@/components/CooldownTimer";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const ONE_WEEK_MS = 7 * ONE_DAY_MS;

export default function Settings() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signOut } = useClerk();
  const backend = useBackend();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [usernameError, setUsernameError] = useState("");
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => backend.user.getCurrentUser(),
  });

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName);
      setUsername(profile.username || "");
    }
  }, [profile]);

  const canChangeAvatar = !profile?.avatarLastChanged || 
    (new Date().getTime() - new Date(profile.avatarLastChanged).getTime() >= ONE_WEEK_MS);

  const canChangeDisplayName = !profile?.displayNameLastChanged || 
    (new Date().getTime() - new Date(profile.displayNameLastChanged).getTime() >= ONE_WEEK_MS);

  const canChangeUsername = !profile?.usernameLastChanged || 
    (new Date().getTime() - new Date(profile.usernameLastChanged).getTime() >= ONE_DAY_MS);

  const checkUsernameMutation = useMutation({
    mutationFn: (newUsername: string) => backend.user.checkUsername({ username: newUsername }),
    onSuccess: (data) => {
      if (!data.available) {
        setUsernameError(data.error || "Username not available");
      } else {
        setUsernameError("");
      }
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: (updates: { displayName?: string; profilePictureUrl?: string; username?: string }) =>
      backend.user.updateProfile(updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    },
    onError: (error: any) => {
      console.error(error);
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (username && username !== profile?.username && username.length >= 3) {
      const timer = setTimeout(() => {
        setIsCheckingUsername(true);
        checkUsernameMutation.mutate(username, {
          onSettled: () => setIsCheckingUsername(false),
        });
      }, 500);
      return () => clearTimeout(timer);
    } else if (username === profile?.username) {
      setUsernameError("");
    }
  }, [username]);

  const handleAvatarClick = () => {
    if (canChangeAvatar) {
      fileInputRef.current?.click();
    } else {
      toast({
        title: "Cooldown Active",
        description: "You can only change your profile picture once per week",
        variant: "destructive",
      });
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid File",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Image must be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUploadingAvatar(true);
      const { uploadUrl, publicUrl } = await backend.user.uploadAvatar();

      await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      await updateProfileMutation.mutateAsync({ profilePictureUrl: publicUrl });
    } catch (error) {
      console.error(error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload profile picture",
        variant: "destructive",
      });
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleUpdateDisplayName = () => {
    if (!canChangeDisplayName) {
      toast({
        title: "Cooldown Active",
        description: "You can only change your display name once per week",
        variant: "destructive",
      });
      return;
    }

    if (displayName.trim() && displayName !== profile?.displayName) {
      updateProfileMutation.mutate({ displayName: displayName.trim() });
    }
  };

  const handleUpdateUsername = () => {
    if (!canChangeUsername) {
      toast({
        title: "Cooldown Active",
        description: "You can only change your username once per day",
        variant: "destructive",
      });
      return;
    }

    if (usernameError) {
      toast({
        title: "Invalid Username",
        description: usernameError,
        variant: "destructive",
      });
      return;
    }

    if (username.trim() && username !== profile?.username) {
      updateProfileMutation.mutate({ username: username.trim() });
    }
  };

  const handleLogout = () => {
    signOut();
    navigate("/");
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      <div className="border-b px-4 py-3 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-semibold">Settings</h1>
      </div>

      <div className="p-4 space-y-4 overflow-auto">
        <Card>
          <CardHeader>
            <CardTitle>Profile Settings</CardTitle>
            <CardDescription>Manage your profile picture, display name, and username</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <label className="text-sm font-medium flex items-center gap-2">
                <Camera className="h-4 w-4" />
                Profile Picture
              </label>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <button
                    onClick={handleAvatarClick}
                    disabled={!canChangeAvatar || isUploadingAvatar}
                    className="relative group"
                  >
                    <div className="w-24 h-24 rounded-full overflow-hidden bg-muted flex items-center justify-center border-2 border-border">
                      {profile?.profilePictureUrl ? (
                        <img
                          src={profile.profilePictureUrl}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="h-12 w-12 text-muted-foreground" />
                      )}
                    </div>
                    {canChangeAvatar && !isUploadingAvatar && (
                      <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="h-6 w-6 text-white" />
                      </div>
                    )}
                    {isUploadingAvatar && (
                      <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                        <Loader2 className="h-6 w-6 text-white animate-spin" />
                      </div>
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm text-muted-foreground">
                    Click to change your profile picture
                  </p>
                  <CooldownTimer
                    lastChanged={profile?.avatarLastChanged}
                    cooldownMs={ONE_WEEK_MS}
                    type="avatar"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium flex items-center gap-2">
                <User className="h-4 w-4" />
                Display Name
              </label>
              <div className="space-y-2">
                <Input
                  type="text"
                  placeholder="Enter display name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  disabled={!canChangeDisplayName}
                />
                <div className="flex items-center justify-between">
                  <CooldownTimer
                    lastChanged={profile?.displayNameLastChanged}
                    cooldownMs={ONE_WEEK_MS}
                    type="displayName"
                  />
                  <Button
                    onClick={handleUpdateDisplayName}
                    disabled={
                      !canChangeDisplayName ||
                      !displayName.trim() ||
                      displayName === profile?.displayName ||
                      updateProfileMutation.isPending
                    }
                    size="sm"
                  >
                    Update
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium flex items-center gap-2">
                <AtSign className="h-4 w-4" />
                Username
              </label>
              <div className="space-y-2">
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Enter username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={!canChangeUsername}
                    className={usernameError ? "border-destructive" : ""}
                  />
                  {isCheckingUsername && (
                    <Loader2 className="h-4 w-4 animate-spin absolute right-3 top-3 text-muted-foreground" />
                  )}
                </div>
                {usernameError && (
                  <p className="text-xs text-destructive">{usernameError}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  3-20 characters, letters, numbers, and underscores only
                </p>
                <div className="flex items-center justify-between">
                  <CooldownTimer
                    lastChanged={profile?.usernameLastChanged}
                    cooldownMs={ONE_DAY_MS}
                    type="username"
                  />
                  <Button
                    onClick={handleUpdateUsername}
                    disabled={
                      !canChangeUsername ||
                      !username.trim() ||
                      username === profile?.username ||
                      !!usernameError ||
                      isCheckingUsername ||
                      updateProfileMutation.isPending
                    }
                    size="sm"
                  >
                    Update
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Message Retention</CardTitle>
            <CardDescription>Information about message storage</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              All messages are automatically deleted after 10 days to keep the app lightweight
              and protect your privacy.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" onClick={handleLogout} className="w-full">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
