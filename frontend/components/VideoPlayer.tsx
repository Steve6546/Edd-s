import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Download, Share2, Trash, Play, Pause, Volume2, VolumeX, Maximize } from "lucide-react";
import { cn } from "@/lib/utils";

interface VideoPlayerProps {
  videoUrl: string;
  onClose: () => void;
  onDownload?: () => void;
  onShare?: () => void;
  onDelete?: () => void;
  showDelete?: boolean;
}

export default function VideoPlayer({ 
  videoUrl, 
  onClose, 
  onDownload, 
  onShare, 
  onDelete,
  showDelete 
}: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [volume, setVolume] = useState(1);
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsTimeoutRef = useRef<any>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleLoadedMetadata = () => setDuration(video.duration);
    const handleEnded = () => setIsPlaying(false);

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('ended', handleEnded);
    };
  }, []);

  useEffect(() => {
    if (showControls) {
      clearTimeout(controlsTimeoutRef.current);
      controlsTimeoutRef.current = setTimeout(() => {
        if (isPlaying) {
          setShowControls(false);
        }
      }, 3000);
    }
    return () => clearTimeout(controlsTimeoutRef.current);
  }, [showControls, isPlaying]);

  const togglePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const newTime = parseFloat(e.target.value);
    video.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const newVolume = parseFloat(e.target.value);
    video.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleFullscreen = () => {
    const video = videoRef.current;
    if (!video) return;
    
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      video.requestFullscreen();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleMouseMove = () => {
    setShowControls(true);
  };

  return (
    <div 
      className="fixed inset-0 bg-black z-50 flex flex-col"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      onMouseMove={handleMouseMove}
      onTouchStart={handleMouseMove}
    >
      <div 
        className={cn(
          "flex items-center justify-between p-3 sm:p-4 bg-black/90 border-b border-white/10 backdrop-blur-sm transition-all duration-300",
          showControls ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
        )}
      >
        <Button 
          variant="ghost" 
          onClick={onClose} 
          className="text-white hover:bg-white/10"
          size="sm"
        >
          <X className="h-5 w-5 mr-2" />
          Close
        </Button>
        <div className="flex gap-2">
          {onDownload && (
            <Button 
              variant="ghost" 
              onClick={onDownload} 
              className="text-white hover:bg-white/10"
              size="sm"
            >
              <Download className="h-5 w-5" />
            </Button>
          )}
          {onShare && (
            <Button 
              variant="ghost" 
              onClick={onShare} 
              className="text-white hover:bg-white/10"
              size="sm"
            >
              <Share2 className="h-5 w-5" />
            </Button>
          )}
          {showDelete && onDelete && (
            <Button 
              variant="ghost" 
              onClick={onDelete} 
              className="text-red-400 hover:bg-red-400/10"
              size="sm"
            >
              <Trash className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
      
      <div className="flex-1 flex items-center justify-center relative bg-black">
        <video
          ref={videoRef}
          src={videoUrl}
          autoPlay
          className="max-w-full max-h-full"
          onClick={togglePlayPause}
        />
        
        {!isPlaying && (
          <button
            onClick={togglePlayPause}
            className="absolute inset-0 flex items-center justify-center bg-black/30 transition-opacity hover:bg-black/40"
          >
            <div className="bg-white/20 backdrop-blur-sm rounded-full p-6 sm:p-8">
              <Play className="h-12 w-12 sm:h-16 sm:w-16 text-white ml-2" fill="white" />
            </div>
          </button>
        )}
      </div>
      
      <div 
        className={cn(
          "bg-black/90 backdrop-blur-sm transition-all duration-300 border-t border-white/10",
          showControls ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
        )}
      >
        <div className="px-4 pt-3 pb-4">
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white"
            style={{
              background: `linear-gradient(to right, white 0%, white ${(currentTime / duration) * 100}%, rgba(255,255,255,0.2) ${(currentTime / duration) * 100}%, rgba(255,255,255,0.2) 100%)`,
            }}
          />
          
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={togglePlayPause}
                className="text-white hover:bg-white/10 h-9 w-9"
              >
                {isPlaying ? (
                  <Pause className="h-5 w-5" fill="white" />
                ) : (
                  <Play className="h-5 w-5" fill="white" />
                )}
              </Button>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleMute}
                  className="text-white hover:bg-white/10 h-9 w-9"
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="h-5 w-5" />
                  ) : (
                    <Volume2 className="h-5 w-5" />
                  )}
                </Button>
                
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-16 sm:w-20 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white hidden sm:block"
                />
              </div>
              
              <span className="text-white text-sm font-mono">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFullscreen}
              className="text-white hover:bg-white/10 h-9 w-9"
            >
              <Maximize className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
