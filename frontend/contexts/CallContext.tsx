import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import backend from "~backend/client";
import type { CallSignal } from "~backend/call/stream";
import { useToast } from "@/components/ui/use-toast";
import { StreamReconnectionManager } from "@/lib/reconnection";

interface CallState {
  callId: string | null;
  callType: "voice" | "video" | null;
  isIncoming: boolean;
  isActive: boolean;
  remoteUserId: string | null;
  remoteStream: MediaStream | null;
  localStream: MediaStream | null;
  isMuted: boolean;
  isVideoEnabled: boolean;
  connectionQuality: "good" | "poor" | "bad" | null;
}

interface CallContextType {
  callState: CallState;
  initiateCall: (recipientId: string, callType: "voice" | "video") => Promise<void>;
  answerCall: () => Promise<void>;
  rejectCall: () => Promise<void>;
  endCall: () => Promise<void>;
  toggleMute: () => void;
  toggleVideo: () => void;
  localVideoRef: React.RefObject<HTMLVideoElement | null>;
  remoteVideoRef: React.RefObject<HTMLVideoElement | null>;
}

const CallContext = createContext<CallContextType | null>(null);

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

const CALL_TIMEOUT_MS = 30000;

export function CallProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  
  const [callState, setCallState] = useState<CallState>({
    callId: null,
    callType: null,
    isIncoming: false,
    isActive: false,
    remoteUserId: null,
    remoteStream: null,
    localStream: null,
    isMuted: false,
    isVideoEnabled: true,
    connectionQuality: null,
  });

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const pendingIceCandidatesRef = useRef<RTCIceCandidate[]>([]);
  const callTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const statsIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const streamManagerRef = useRef<StreamReconnectionManager<CallSignal> | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const isComponentMountedRef = useRef(true);

  const cleanupCall = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (callTimeoutRef.current) {
      clearTimeout(callTimeoutRef.current);
      callTimeoutRef.current = null;
    }
    if (statsIntervalRef.current) {
      clearInterval(statsIntervalRef.current);
      statsIntervalRef.current = null;
    }
    pendingIceCandidatesRef.current = [];
    setCallState({
      callId: null,
      callType: null,
      isIncoming: false,
      isActive: false,
      remoteUserId: null,
      remoteStream: null,
      localStream: null,
      isMuted: false,
      isVideoEnabled: true,
      connectionQuality: null,
    });
  }, []);

  const startConnectionQualityMonitoring = useCallback(() => {
    if (!peerConnectionRef.current) return;

    statsIntervalRef.current = setInterval(async () => {
      try {
        if (!peerConnectionRef.current) return;

        const stats = await peerConnectionRef.current.getStats();
        let packetsLost = 0;
        let packetsReceived = 0;
        let currentRoundTripTime = 0;

        stats.forEach((report) => {
          if (report.type === "inbound-rtp" && report.mediaType === "video") {
            packetsLost += report.packetsLost || 0;
            packetsReceived += report.packetsReceived || 0;
          }
          if (report.type === "candidate-pair" && report.state === "succeeded") {
            currentRoundTripTime = report.currentRoundTripTime || 0;
          }
        });

        const packetLossRate = packetsReceived > 0 ? packetsLost / (packetsLost + packetsReceived) : 0;
        
        let quality: "good" | "poor" | "bad" = "good";
        if (packetLossRate > 0.1 || currentRoundTripTime > 0.3) {
          quality = "bad";
        } else if (packetLossRate > 0.05 || currentRoundTripTime > 0.15) {
          quality = "poor";
        }

        setCallState(prev => ({ ...prev, connectionQuality: quality }));
      } catch (error) {
        console.error("Error monitoring connection quality:", error);
      }
    }, 2000);
  }, []);

  const createPeerConnection = useCallback((recipientId: string, callId: string) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = async (event) => {
      if (event.candidate) {
        try {
          await backend.call.signal({
            callId,
            recipientId,
            signalType: "ice-candidate",
            data: event.candidate.toJSON() as Record<string, unknown>,
          });
        } catch (error) {
          console.error("Failed to send ICE candidate:", error);
        }
      }
    };

    pc.ontrack = (event) => {
      setCallState(prev => ({ ...prev, remoteStream: event.streams[0] }));
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
        cleanupCall();
      } else if (pc.connectionState === "connected") {
        startConnectionQualityMonitoring();
      }
    };

    return pc;
  }, [cleanupCall, startConnectionQualityMonitoring]);

  const handleCallTimeout = useCallback(async (callId: string) => {
    try {
      toast({
        title: "Call missed",
        description: "The call was not answered in time.",
        variant: "destructive",
      });
      cleanupCall();
    } catch (error) {
      console.error("Failed to handle call timeout:", error);
    }
  }, [cleanupCall, toast]);

  const initiateCall = useCallback(async (recipientId: string, callType: "voice" | "video") => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: callType === "video",
      });

      localStreamRef.current = stream;
      setCallState(prev => ({ ...prev, localStream: stream, callType, isVideoEnabled: callType === "video" }));

      if (localVideoRef.current && callType === "video") {
        localVideoRef.current.srcObject = stream;
      }

      const response = await backend.call.initiate({ recipientId, callType });
      const callId = response.callId;

      callTimeoutRef.current = setTimeout(() => {
        if (callState.callId === callId && !callState.isActive) {
          handleCallTimeout(callId);
        }
      }, CALL_TIMEOUT_MS);

      const pc = createPeerConnection(recipientId, callId);
      peerConnectionRef.current = pc;

      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      await backend.call.signal({
        callId,
        recipientId,
        signalType: "offer",
        data: offer as unknown as Record<string, unknown>,
      });

      setCallState(prev => ({
        ...prev,
        callId,
        remoteUserId: recipientId,
        isIncoming: false,
        isActive: false,
      }));
    } catch (error) {
      console.error("Failed to initiate call:", error);
      
      if (error instanceof Error) {
        if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
          toast({
            title: "Permission denied",
            description: "Please allow access to your camera and microphone in your browser settings to make calls.",
            variant: "destructive",
          });
        } else if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
          toast({
            title: "No devices found",
            description: "No camera or microphone detected. Please connect a device and try again.",
            variant: "destructive",
          });
        } else if (error.name === "NotReadableError" || error.name === "TrackStartError") {
          toast({
            title: "Device in use",
            description: "Your camera or microphone is already in use by another application.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Call failed",
            description: "Unable to start the call. Please try again.",
            variant: "destructive",
          });
        }
      }
      
      cleanupCall();
    }
  }, [createPeerConnection, cleanupCall, handleCallTimeout, toast, callState.callId, callState.isActive]);

  const answerCall = useCallback(async () => {
    if (!callState.callId || !callState.remoteUserId || !callState.callType) return;

    if (callTimeoutRef.current) {
      clearTimeout(callTimeoutRef.current);
      callTimeoutRef.current = null;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: callState.callType === "video",
      });

      localStreamRef.current = stream;
      setCallState(prev => ({ ...prev, localStream: stream, isVideoEnabled: callState.callType === "video" }));

      if (localVideoRef.current && callState.callType === "video") {
        localVideoRef.current.srcObject = stream;
      }

      if (peerConnectionRef.current) {
        stream.getTracks().forEach(track => peerConnectionRef.current!.addTrack(track, stream));

        const answer = await peerConnectionRef.current.createAnswer();
        await peerConnectionRef.current.setLocalDescription(answer);

        await backend.call.signal({
          callId: callState.callId,
          recipientId: callState.remoteUserId,
          signalType: "answer",
          data: answer as unknown as Record<string, unknown>,
        });

        if (peerConnectionRef.current.remoteDescription) {
          for (const candidate of pendingIceCandidatesRef.current) {
            await peerConnectionRef.current.addIceCandidate(candidate);
          }
          pendingIceCandidatesRef.current = [];
        }

        await backend.call.answer({ callId: callState.callId });

        setCallState(prev => ({ ...prev, isIncoming: false, isActive: true }));
      }
    } catch (error) {
      console.error("Failed to answer call:", error);
      
      if (error instanceof Error) {
        if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
          toast({
            title: "Permission denied",
            description: "Please allow access to your camera and microphone in your browser settings to answer calls.",
            variant: "destructive",
          });
        } else if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
          toast({
            title: "No devices found",
            description: "No camera or microphone detected. Please connect a device and try again.",
            variant: "destructive",
          });
        } else if (error.name === "NotReadableError" || error.name === "TrackStartError") {
          toast({
            title: "Device in use",
            description: "Your camera or microphone is already in use by another application.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Call failed",
            description: "Unable to answer the call. Please try again.",
            variant: "destructive",
          });
        }
      }
      
      cleanupCall();
    }
  }, [callState.callId, callState.remoteUserId, callState.callType, cleanupCall, toast]);

  const rejectCall = useCallback(async () => {
    if (!callState.callId) return;

    if (callTimeoutRef.current) {
      clearTimeout(callTimeoutRef.current);
      callTimeoutRef.current = null;
    }

    try {
      await backend.call.reject({ callId: callState.callId });
      cleanupCall();
    } catch (error) {
      console.error("Failed to reject call:", error);
      cleanupCall();
    }
  }, [callState.callId, cleanupCall]);

  const endCall = useCallback(async () => {
    if (!callState.callId) return;

    try {
      await backend.call.end({ callId: callState.callId });
      cleanupCall();
    } catch (error) {
      console.error("Failed to end call:", error);
      cleanupCall();
    }
  }, [callState.callId, cleanupCall]);

  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setCallState(prev => ({ ...prev, isMuted: !audioTrack.enabled }));
      }
    }
  }, []);

  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setCallState(prev => ({ ...prev, isVideoEnabled: videoTrack.enabled }));
      }
    }
  }, []);

  useEffect(() => {
    isComponentMountedRef.current = true;

    const handleSignal = async (signal: CallSignal) => {
      if (!isComponentMountedRef.current) return;

      try {
        if (signal.signalType === "offer") {
          const pc = createPeerConnection(signal.fromUserId, signal.callId);
          peerConnectionRef.current = pc;

          if (signal.data && typeof signal.data === "object" && "sdp" in signal.data && "type" in signal.data) {
            const desc = signal.data as unknown as RTCSessionDescriptionInit;
            await pc.setRemoteDescription(new RTCSessionDescription(desc));
          }

          callTimeoutRef.current = setTimeout(() => {
            if (callState.callId === signal.callId && callState.isIncoming && !callState.isActive) {
              handleCallTimeout(signal.callId);
            }
          }, CALL_TIMEOUT_MS);

          setCallState(prev => ({
            ...prev,
            callId: signal.callId,
            callType: (signal.data as any).callType,
            isIncoming: true,
            remoteUserId: signal.fromUserId,
          }));
        } else if (signal.signalType === "answer") {
          if (peerConnectionRef.current && signal.data && "type" in signal.data) {
            const desc = signal.data as unknown as RTCSessionDescriptionInit;
            await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(desc));

            if (peerConnectionRef.current.remoteDescription) {
              for (const candidate of pendingIceCandidatesRef.current) {
                await peerConnectionRef.current.addIceCandidate(candidate);
              }
              pendingIceCandidatesRef.current = [];
            }

            if (callTimeoutRef.current) {
              clearTimeout(callTimeoutRef.current);
              callTimeoutRef.current = null;
            }

            setCallState(prev => ({ ...prev, isActive: true }));
          }
        } else if (signal.signalType === "ice-candidate") {
          if (signal.data) {
            const candidate = new RTCIceCandidate(signal.data as RTCIceCandidateInit);
            if (peerConnectionRef.current?.remoteDescription) {
              await peerConnectionRef.current.addIceCandidate(candidate);
            } else {
              pendingIceCandidatesRef.current.push(candidate);
            }
          }
        } else if (signal.signalType === "call-ended") {
          cleanupCall();
        }
      } catch (error) {
        console.error("Error handling signal:", error);
      }
    };

    if (!streamManagerRef.current) {
      streamManagerRef.current = new StreamReconnectionManager<CallSignal>(
        () => backend.call.stream(),
        {
          initialDelayMs: 1000,
          maxDelayMs: 30000,
          maxAttempts: Infinity,
          backoffMultiplier: 2,
        }
      );

      streamManagerRef.current.onMessage(handleSignal);

      streamManagerRef.current.onError((error) => {
        console.error("Call stream error:", error);
      });
    }

    streamManagerRef.current.connect();

    return () => {
      isComponentMountedRef.current = false;
      
      if (streamManagerRef.current) {
        streamManagerRef.current.disconnect();
        streamManagerRef.current = null;
      }
    };
  }, [createPeerConnection, cleanupCall, handleCallTimeout, callState.callId, callState.isIncoming, callState.isActive]);

  return (
    <CallContext.Provider
      value={{
        callState,
        initiateCall,
        answerCall,
        rejectCall,
        endCall,
        toggleMute,
        toggleVideo,
        localVideoRef,
        remoteVideoRef,
      }}
    >
      {children}
    </CallContext.Provider>
  );
}

export function useCall() {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error("useCall must be used within CallProvider");
  }
  return context;
}
