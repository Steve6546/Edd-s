import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface VoiceNoteRecorderProps {
  onSend: (audioBlob: Blob, duration: number) => void;
  onCancel: () => void;
}

export default function VoiceNoteRecorder({ onSend, onCancel }: VoiceNoteRecorderProps) {
  const [recordingTime, setRecordingTime] = useState(0);
  const [waveformData, setWaveformData] = useState<number[]>(Array(40).fill(0));
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<any>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    startRecording();
    return () => {
      stopRecording();
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const updateWaveform = () => {
        if (!analyserRef.current) return;
        
        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyserRef.current.getByteFrequencyData(dataArray);
        
        const step = Math.floor(bufferLength / 40);
        const newWaveform = Array.from({ length: 40 }, (_, i) => {
          const value = dataArray[i * step] || 0;
          return Math.min(value / 255, 1);
        });
        
        setWaveformData(newWaveform);
        animationFrameRef.current = requestAnimationFrame(updateWaveform);
      };
      
      updateWaveform();

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach(track => track.stop());
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };

      mediaRecorder.start();

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

    } catch (error) {
      console.error("Recording error:", error);
      onCancel();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  };

  const handleSend = () => {
    stopRecording();
    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
    if (recordingTime > 0) {
      onSend(audioBlob, recordingTime);
    } else {
      onCancel();
    }
  };

  const handleCancel = () => {
    stopRecording();
    onCancel();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-indigo-500/10 backdrop-blur-sm z-20 flex items-center px-3 sm:px-4">
      <Button
        variant="ghost"
        size="icon"
        onClick={handleCancel}
        className="h-10 w-10 sm:h-11 sm:w-11 flex-shrink-0 text-red-500 hover:text-red-600 hover:bg-red-500/10"
      >
        <X className="h-5 w-5" />
      </Button>

      <div className="flex-1 mx-3 sm:mx-4">
        <div className="bg-card/80 backdrop-blur rounded-3xl px-4 sm:px-6 py-3 sm:py-4 shadow-xl border border-primary/20">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 bg-red-500 rounded-full animate-pulse shadow-lg shadow-red-500/50"></div>
              <span className="text-sm sm:text-base font-semibold text-foreground">Recording</span>
            </div>
            <span className="text-base sm:text-lg font-mono font-bold text-primary">{formatTime(recordingTime)}</span>
          </div>
          
          <div className="flex items-center justify-center gap-0.5 sm:gap-1 h-12 sm:h-16">
            {waveformData.map((value, i) => {
              const height = Math.max(value * 100, 8);
              const hue = 200 + (i / waveformData.length) * 60;
              return (
                <div
                  key={i}
                  className="flex-1 rounded-full transition-all duration-75"
                  style={{
                    height: `${height}%`,
                    background: `linear-gradient(to top, hsl(${hue}, 70%, 50%), hsl(${hue}, 80%, 60%))`,
                    boxShadow: value > 0.3 ? `0 0 8px hsl(${hue}, 70%, 50%)` : 'none',
                  }}
                />
              );
            })}
          </div>
        </div>
      </div>

      <Button
        onClick={handleSend}
        size="icon"
        className="rounded-full h-12 w-12 sm:h-14 sm:w-14 flex-shrink-0 bg-gradient-to-br from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-lg shadow-blue-500/30"
      >
        <Send className="h-5 w-5 sm:h-6 sm:w-6" />
      </Button>
    </div>
  );
}
