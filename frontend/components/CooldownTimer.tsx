import { useEffect, useState } from "react";

interface CooldownTimerProps {
  lastChanged?: Date;
  cooldownMs: number;
  type: "avatar" | "displayName" | "username";
}

export function CooldownTimer({ lastChanged, cooldownMs, type }: CooldownTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<string>("");

  useEffect(() => {
    if (!lastChanged) {
      setTimeRemaining("");
      return;
    }

    const updateTimer = () => {
      const now = new Date().getTime();
      const changeTime = new Date(lastChanged).getTime();
      const elapsed = now - changeTime;
      const remaining = cooldownMs - elapsed;

      if (remaining <= 0) {
        setTimeRemaining("");
        return;
      }

      const days = Math.floor(remaining / (24 * 60 * 60 * 1000));
      const hours = Math.floor((remaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
      const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));

      if (days > 0) {
        setTimeRemaining(`${days}d ${hours}h`);
      } else if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m`);
      } else {
        setTimeRemaining(`${minutes}m`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000);

    return () => clearInterval(interval);
  }, [lastChanged, cooldownMs]);

  if (!timeRemaining) return null;

  const label = type === "avatar" 
    ? "Profile picture" 
    : type === "displayName" 
    ? "Display name" 
    : "Username";

  return (
    <p className="text-xs text-muted-foreground">
      {label} can be changed in {timeRemaining}
    </p>
  );
}
