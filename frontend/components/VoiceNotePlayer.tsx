import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause } from "lucide-react";
import { cn } from "@/lib/utils";

interface VoiceNotePlayerProps {
  audioUrl: string;
  duration?: number;
  isOwn?: boolean;
}

export default function VoiceNotePlayer({ audioUrl, duration, isOwn }: VoiceNotePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(duration || 0);
  const [waveformData, setWaveformData] = useState<number[]>(Array(30).fill(0.3));
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    audio.addEventListener('loadedmetadata', () => {
      setAudioDuration(audio.duration);
      generateWaveform(audio);
    });

    audio.addEventListener('timeupdate', () => {
      setCurrentTime(audio.currentTime);
    });

    audio.addEventListener('ended', () => {
      setIsPlaying(false);
      setCurrentTime(0);
    });

    return () => {
      audio.pause();
      audio.remove();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [audioUrl]);

  const generateWaveform = async (audio: HTMLAudioElement) => {
    try {
      const audioContext = new AudioContext();
      const response = await fetch(audioUrl);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      const rawData = audioBuffer.getChannelData(0);
      const samples = 30;
      const blockSize = Math.floor(rawData.length / samples);
      const waveform = [];
      
      for (let i = 0; i < samples; i++) {
        let sum = 0;
        for (let j = 0; j < blockSize; j++) {
          sum += Math.abs(rawData[i * blockSize + j]);
        }
        waveform.push(sum / blockSize);
      }
      
      const max = Math.max(...waveform);
      const normalized = waveform.map(v => Math.max(v / max, 0.1));
      setWaveformData(normalized);
    } catch (error) {
      console.error("Waveform generation error:", error);
    }
  };

  const togglePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (index: number) => {
    if (!audioRef.current) return;
    const seekTime = (index / waveformData.length) * audioDuration;
    audioRef.current.currentTime = seekTime;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = audioDuration > 0 ? currentTime / audioDuration : 0;

  return (
    <div className={cn(
      "flex items-center gap-2 sm:gap-3 min-w-[240px] sm:min-w-[280px] max-w-[320px]",
      "p-2 sm:p-3 rounded-2xl",
      isOwn ? "bg-white/10" : "bg-secondary/30"
    )}>
      <Button
        variant="ghost"
        size="icon"
        onClick={togglePlayPause}
        className={cn(
          "h-8 w-8 sm:h-10 sm:w-10 rounded-full flex-shrink-0",
          isOwn 
            ? "bg-white/20 hover:bg-white/30 text-white" 
            : "bg-primary/10 hover:bg-primary/20 text-primary"
        )}
      >
        {isPlaying ? (
          <Pause className="h-4 w-4 sm:h-5 sm:w-5" fill="currentColor" />
        ) : (
          <Play className="h-4 w-4 sm:h-5 sm:w-5 ml-0.5" fill="currentColor" />
        )}
      </Button>

      <div className="flex-1 flex flex-col gap-1">
        <div className="flex items-center justify-center gap-0.5 h-8 sm:h-10 cursor-pointer">
          {waveformData.map((value, i) => {
            const played = i / waveformData.length <= progress;
            const height = Math.max(value * 100, 15);
            
            return (
              <div
                key={i}
                className="flex-1 rounded-full transition-all duration-150 hover:opacity-80"
                style={{
                  height: `${height}%`,
                  backgroundColor: played 
                    ? (isOwn ? 'rgba(255, 255, 255, 0.9)' : 'hsl(var(--primary))')
                    : (isOwn ? 'rgba(255, 255, 255, 0.3)' : 'hsl(var(--muted-foreground) / 0.3)'),
                }}
                onClick={() => handleSeek(i)}
              />
            );
          })}
        </div>
        
        <div className={cn(
          "flex items-center justify-between text-[10px] sm:text-xs font-mono px-1",
          isOwn ? "text-white/70" : "text-muted-foreground"
        )}>
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(audioDuration)}</span>
        </div>
      </div>
    </div>
  );
}
