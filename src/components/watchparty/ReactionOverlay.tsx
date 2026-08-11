import { useEffect, useState } from "react";
import { UI_DELAY_MS } from "@/constants/timing";
import { cn } from "@/lib/utils";

export interface FloatingReaction {
  id: string;
  emoji: string;
  user: string;
  x: number;
}

interface ReactionOverlayProps {
  reactions: FloatingReaction[];
}

export function ReactionOverlay({ reactions }: ReactionOverlayProps) {
  return (
    <>
      <div className="pointer-events-none absolute inset-0 z-25 overflow-hidden">
        {reactions.map((r) => (
          <ReactionBubble key={r.id} reaction={r} />
        ))}
      </div>
      <style>{`
        @keyframes floatUp {
          0%   { transform: translateY(0) scale(1);   opacity: 1; }
          100% { transform: translateY(-140px) scale(1.4); opacity: 0; }
        }
      `}</style>
    </>
  );
}

function ReactionBubble({ reaction }: { reaction: FloatingReaction }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = window.setTimeout(() => setVisible(false), UI_DELAY_MS.reaction);

    return () => window.clearTimeout(t);
  }, []);

  if (!visible) return null;

  return (
    <div
      className={cn("absolute bottom-8 flex flex-col items-center")}
      style={{
        left: `${reaction.x}%`,
        animation: "floatUp 2.8s ease-out forwards",
      }}
    >
      <span className="text-4xl drop-shadow-lg md:text-5xl">{reaction.emoji}</span>
      <span className="mt-1 max-w-[120px] truncate rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white">
        {reaction.user}
      </span>
    </div>
  );
}
