import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ReactionPickerProps {
  onReact: (emoji: string) => void;
  onClose: () => void;
}

const REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏", "🔥", "👏"];

export default function ReactionPicker({ onReact, onClose }: ReactionPickerProps) {
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="bg-card border border-border rounded-3xl shadow-2xl p-2 flex gap-1 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {REACTIONS.map((emoji) => (
          <Button
            key={emoji}
            variant="ghost"
            size="lg"
            onClick={() => {
              onReact(emoji);
              onClose();
            }}
            className="h-12 w-12 sm:h-14 sm:w-14 text-2xl sm:text-3xl hover:scale-125 transition-transform rounded-full"
          >
            {emoji}
          </Button>
        ))}
      </div>
    </div>
  );
}
