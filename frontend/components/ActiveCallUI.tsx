import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useCall } from "../contexts/CallContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Mic, MicOff, Video, VideoOff, PhoneOff, Wifi, WifiOff } from "lucide-react";
import { useBackend } from "../lib/backend";

export default function ActiveCallUI() {
  const {
    callState,
    endCall,
    toggleMute,
    toggleVideo,
    localVideoRef,
    remoteVideoRef,
  } = useCall();
  const backend = useBackend();
  const [otherUserName, setOtherUserName] = useState<string>("Unknown");
  const [callDuration, setCallDuration] = useState(0);

  const { data: otherUserProfile } = useQuery({
    queryKey: ["userProfile", callState.remoteUserId],
    queryFn: () => backend.user.getProfile({ userId: callState.remoteUserId! }),
    enabled: !!callState.remoteUserId,
  });

  useEffect(() => {
    if (otherUserProfile) {
      setOtherUserName(otherUserProfile.displayName || otherUserProfile.username);
    }
  }, [otherUserProfile]);

  useEffect(() => {
    if (!callState.isActive) {
      setCallDuration(0);
      return;
    }

    const interval = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [callState.isActive]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (!callState.callId || callState.isIncoming) {
    return null;
  }

  const isVideoCall = callState.callType === "video";

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      <div className="flex-1 relative bg-black">
        {isVideoCall && callState.remoteStream ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
            <div className="text-center">
              <div className="w-32 h-32 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                <span className="text-5xl font-bold text-primary">
                  {otherUserName.charAt(0).toUpperCase()}
                </span>
              </div>
              <h2 className="text-2xl font-semibold text-foreground">{otherUserName}</h2>
              <p className="text-muted-foreground mt-2">
                {callState.isActive ? formatDuration(callDuration) : "Calling..."}
              </p>
            </div>
          </div>
        )}

        {callState.connectionQuality && callState.isActive && (
          <div className="absolute top-4 left-4">
            <Card className="px-3 py-2 flex items-center gap-2">
              {callState.connectionQuality === "good" ? (
                <>
                  <Wifi className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-500">Good</span>
                </>
              ) : callState.connectionQuality === "poor" ? (
                <>
                  <Wifi className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm text-yellow-500">Poor</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-4 w-4 text-red-500" />
                  <span className="text-sm text-red-500">Bad</span>
                </>
              )}
            </Card>
          </div>
        )}

        {isVideoCall && callState.localStream && (
          <Card className="absolute top-4 right-4 w-48 h-36 overflow-hidden border-2 border-border">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          </Card>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
          <div className="flex items-center justify-center gap-4">
            {isVideoCall && (
              <Button
                variant={callState.isVideoEnabled ? "secondary" : "destructive"}
                size="lg"
                className="rounded-full w-16 h-16"
                onClick={toggleVideo}
              >
                {callState.isVideoEnabled ? (
                  <Video className="h-6 w-6" />
                ) : (
                  <VideoOff className="h-6 w-6" />
                )}
              </Button>
            )}

            <Button
              variant={callState.isMuted ? "destructive" : "secondary"}
              size="lg"
              className="rounded-full w-16 h-16"
              onClick={toggleMute}
            >
              {callState.isMuted ? (
                <MicOff className="h-6 w-6" />
              ) : (
                <Mic className="h-6 w-6" />
              )}
            </Button>

            <Button
              variant="destructive"
              size="lg"
              className="rounded-full w-16 h-16"
              onClick={endCall}
            >
              <PhoneOff className="h-6 w-6" />
            </Button>
          </div>

          {callState.isActive && (
            <div className="text-center mt-4">
              <p className="text-white text-sm">{formatDuration(callDuration)}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
