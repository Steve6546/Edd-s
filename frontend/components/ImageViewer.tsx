import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Download, Share2, Trash } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePerformanceTracking } from "@/lib/performance";

interface ImageViewerProps {
  imageUrl: string;
  onClose: () => void;
  onDownload?: () => void;
  onShare?: () => void;
  onDelete?: () => void;
  showDelete?: boolean;
}

export default function ImageViewer({ 
  imageUrl, 
  onClose, 
  onDownload, 
  onShare, 
  onDelete,
  showDelete 
}: ImageViewerProps) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [lastTouchDistance, setLastTouchDistance] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const perf = usePerformanceTracking();
  const imageLoadTrackerRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    imageLoadTrackerRef.current = perf.trackImageLoad(imageUrl);
  }, [imageUrl, perf]);

  const handleImageLoad = () => {
    if (imageLoadTrackerRef.current) {
      imageLoadTrackerRef.current();
      imageLoadTrackerRef.current = null;
    }
  };

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setScale((prevScale) => Math.min(Math.max(prevScale * delta, 1), 5));
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
    }

    return () => {
      if (container) {
        container.removeEventListener('wheel', handleWheel);
      }
    };
  }, []);

  const getTouchDistance = (touches: React.TouchList) => {
    const touch1 = touches[0];
    const touch2 = touches[1];
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const distance = getTouchDistance(e.touches);
      setLastTouchDistance(distance);
    } else if (e.touches.length === 1 && scale > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y,
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const distance = getTouchDistance(e.touches);
      if (lastTouchDistance > 0) {
        const delta = distance / lastTouchDistance;
        setScale((prevScale) => Math.min(Math.max(prevScale * delta, 1), 5));
      }
      setLastTouchDistance(distance);
    } else if (e.touches.length === 1 && isDragging && scale > 1) {
      e.preventDefault();
      setPosition({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y,
      });
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    setLastTouchDistance(0);
    
    if (scale === 1) {
      setPosition({ x: 0, y: 0 });
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && scale > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (scale === 1) {
      setScale(2.5);
      const rect = imageRef.current?.getBoundingClientRect();
      if (rect) {
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;
        setPosition({
          x: (centerX - clickX) * 1.5,
          y: (centerY - clickY) * 1.5,
        });
      }
    } else {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black z-50 flex flex-col"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="flex items-center justify-between p-3 sm:p-4 bg-black/90 border-b border-white/10 backdrop-blur-sm">
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
      
      <div 
        ref={containerRef}
        className="flex-1 flex items-center justify-center overflow-hidden relative"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ 
          cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
          touchAction: 'none',
        }}
      >
        <img
          ref={imageRef}
          src={imageUrl}
          alt="Full view"
          className="max-w-full max-h-full object-contain select-none"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transition: isDragging ? 'none' : 'transform 0.2s ease-out',
          }}
          onDoubleClick={handleDoubleClick}
          onLoad={handleImageLoad}
          draggable={false}
        />
        
        {scale > 1 && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-3 py-1.5 rounded-full text-sm backdrop-blur-sm">
            {Math.round(scale * 100)}%
          </div>
        )}
        
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-xs backdrop-blur-sm">
          Pinch or scroll to zoom • Double-tap to zoom
        </div>
      </div>
    </div>
  );
}
