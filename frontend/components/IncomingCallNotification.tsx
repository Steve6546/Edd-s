import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useCall } from "../contexts/CallContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Phone, PhoneOff, Video } from "lucide-react";
import { useBackend } from "../lib/backend";

export default function IncomingCallNotification() {
  const { callState, answerCall, rejectCall } = useCall();
  const backend = useBackend();
  const [callerName, setCallerName] = useState<string>("Unknown");

  const { data: callerProfile } = useQuery({
    queryKey: ["userProfile", callState.remoteUserId],
    queryFn: () => backend.user.getProfile({ userId: callState.remoteUserId! }),
    enabled: !!callState.remoteUserId && callState.isIncoming,
  });

  useEffect(() => {
    if (callerProfile) {
      setCallerName(callerProfile.displayName || callerProfile.username);
    }
  }, [callerProfile]);

  if (!callState.isIncoming || callState.isActive) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
      <Card className="w-96 p-6 bg-card border-border">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            {callState.callType === "video" ? (
              <Video className="h-10 w-10 text-primary" />
            ) : (
              <Phone className="h-10 w-10 text-primary" />
            )}
          </div>
          
          <div>
            <h2 className="text-xl font-semibold">{callerName}</h2>
            <p className="text-sm text-muted-foreground">
              Incoming {callState.callType} call
            </p>
          </div>

          <div className="flex gap-4 justify-center pt-4">
            <Button
              variant="destructive"
              size="lg"
              className="rounded-full w-16 h-16"
              onClick={rejectCall}
            >
              <PhoneOff className="h-6 w-6" />
            </Button>
            <Button
              variant="default"
              size="lg"
              className="rounded-full w-16 h-16 bg-green-600 hover:bg-green-700"
              onClick={answerCall}
            >
              <Phone className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
