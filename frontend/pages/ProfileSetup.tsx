import { useState, useEffect } from "react";
import { useBackend } from "@/lib/backend";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Check, X, Upload, User } from "lucide-react";
import { useUser } from "@clerk/clerk-react";

interface ProfileSetupProps {
  onComplete: () => void;
}

const PRESET_AVATARS = [
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Oliver",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Luna",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Max",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Bella",
];

export default function ProfileSetup({ onComplete }: ProfileSetupProps) {
  const backend = useBackend();
  const { user } = useUser();
  const { toast } = useToast();
  
  const [step, setStep] = useState<"photo" | "info">("photo");
  const [profilePicture, setProfilePicture] = useState<string>(user?.imageUrl || PRESET_AVATARS[0]);
  const [displayName, setDisplayName] = useState(user?.fullName || "");
  const [username, setUsername] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "error">("idle");
  const [usernameError, setUsernameError] = useState<string>("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkAbortController, setCheckAbortController] = useState<AbortController | null>(null);

  useEffect(() => {
    if (checkAbortController) {
      checkAbortController.abort();
      setCheckAbortController(null);
    }

    if (username.length === 0) {
      setUsernameStatus("idle");
      setUsernameError("");
      setSuggestions([]);
      return;
    }

    const cleanUsername = username.toLowerCase().replace(/[^a-z0-9_]/g, "");
    if (cleanUsername !== username) {
      setUsername(cleanUsername);
      return;
    }

    if (username.length < 3) {
      setUsernameStatus("error");
      setUsernameError("Username must be at least 3 characters");
      setSuggestions([]);
      return;
    }

    if (username.length > 20) {
      setUsernameStatus("error");
      setUsernameError("Username must be no more than 20 characters");
      setSuggestions([]);
      return;
    }

    if (!/^[a-z0-9_]{3,20}$/.test(username)) {
      setUsernameStatus("error");
      setUsernameError("Username can only contain letters, numbers, and underscores");
      setSuggestions([]);
      return;
    }

    setUsernameStatus("checking");
    setUsernameError("");
    setSuggestions([]);

    const timeoutId = setTimeout(async () => {
      const controller = new AbortController();
      setCheckAbortController(controller);
      
      try {
        const result = await backend.user.checkUsername({ username });
        
        if (controller.signal.aborted) {
          return;
        }
        
        if (result.available) {
          setUsernameStatus("available");
          setUsernameError("");
          setSuggestions([]);
        } else {
          setUsernameStatus("error");
          setUsernameError(result.error || "Username is not available");
          setSuggestions(result.suggestions || []);
        }
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }
        console.error("Failed to check username:", error);
        setUsernameStatus("error");
        setUsernameError("Failed to check username. Please try again.");
      } finally {
        setCheckAbortController(null);
      }
    }, 500);

    return () => {
      clearTimeout(timeoutId);
      if (checkAbortController) {
        checkAbortController.abort();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { uploadUrl, publicUrl } = await backend.user.uploadAvatar();
      
      await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      setProfilePicture(publicUrl);
      toast({ description: "Photo uploaded successfully!" });
    } catch (error) {
      console.error("Failed to upload photo:", error);
      toast({ 
        description: "Failed to upload photo. Please try again.",
        variant: "destructive" 
      });
    }
  };

  const handleComplete = async () => {
    if (!displayName.trim()) {
      toast({ 
        description: "Please enter your name.",
        variant: "destructive" 
      });
      return;
    }

    if (usernameStatus !== "available") {
      toast({ 
        description: "Please choose an available username.",
        variant: "destructive" 
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await backend.user.completeProfileSetup({
        username,
        displayName: displayName.trim(),
        profilePictureUrl: profilePicture,
      });

      if (result.success) {
        toast({ description: "Profile setup complete! Welcome!" });
        onComplete();
      } else {
        toast({ 
          description: result.error || "Failed to complete setup.",
          variant: "destructive" 
        });
      }
    } catch (error) {
      console.error("Failed to complete profile setup:", error);
      toast({ 
        description: "Failed to complete setup. Please try again.",
        variant: "destructive" 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === "photo") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold">Welcome!</h1>
            <p className="text-muted-foreground">Let's set up your profile</p>
          </div>

          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <img
                src={profilePicture}
                alt="Profile"
                className="w-32 h-32 rounded-full object-cover border-4 border-primary"
              />
            </div>

            <div className="flex flex-col gap-3 w-full">
              <label htmlFor="photo-upload">
                <Button variant="outline" className="w-full" asChild>
                  <span>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Photo
                  </span>
                </Button>
                <input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoUpload}
                />
              </label>

              <div className="text-sm text-muted-foreground text-center">or choose a preset</div>
              
              <div className="grid grid-cols-6 gap-2">
                {PRESET_AVATARS.map((avatar, idx) => (
                  <button
                    key={idx}
                    onClick={() => setProfilePicture(avatar)}
                    className={`w-12 h-12 rounded-full border-2 transition-all ${
                      profilePicture === avatar ? "border-primary scale-110" : "border-border hover:border-primary/50"
                    }`}
                  >
                    <img src={avatar} alt={`Avatar ${idx + 1}`} className="w-full h-full rounded-full" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setStep("info")}>
              Skip
            </Button>
            <Button className="flex-1" onClick={() => setStep("info")}>
              Continue
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <img src={profilePicture} alt="Profile" className="w-20 h-20 rounded-full border-2 border-primary" />
          </div>
          <h1 className="text-3xl font-bold">Complete Your Profile</h1>
          <p className="text-muted-foreground">Just a few more details</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Display Name</label>
            <Input
              placeholder="Your Name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={50}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Username</label>
            <div className="relative">
              <Input
                placeholder="username"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                maxLength={20}
                className={
                  usernameStatus === "available" ? "border-green-500" :
                  usernameStatus === "error" ? "border-red-500" : ""
                }
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {usernameStatus === "checking" && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                {usernameStatus === "available" && <Check className="w-4 h-4 text-green-500" />}
                {usernameStatus === "error" && <X className="w-4 h-4 text-red-500" />}
              </div>
            </div>
            {usernameStatus === "available" && (
              <p className="text-xs text-green-600 font-medium flex items-center gap-1">
                <Check className="w-3 h-3" />
                Username is available!
              </p>
            )}
            {usernameStatus === "error" && usernameError && (
              <p className="text-xs text-red-600 font-medium">
                {usernameError}
              </p>
            )}
            {usernameStatus === "idle" && (
              <p className="text-xs text-muted-foreground">
                3-20 characters. Letters, numbers, and underscores only.
              </p>
            )}
            {usernameStatus === "checking" && (
              <p className="text-xs text-muted-foreground">
                Checking availability...
              </p>
            )}
            
            {suggestions.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Suggestions:</p>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => setUsername(suggestion)}
                      className="px-3 py-1 text-sm bg-secondary hover:bg-secondary/80 rounded-full transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={() => setStep("photo")}>
            Back
          </Button>
          <Button 
            className="flex-1" 
            onClick={handleComplete}
            disabled={isSubmitting || usernameStatus !== "available" || !displayName.trim()}
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Complete"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
