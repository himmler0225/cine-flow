import type { ReactNode } from "react";
import { Streamdown } from "streamdown";
import { cn } from "@/lib/utils";

type Props = { from: "user" | "assistant"; children: ReactNode };

export function Message({ from, children }: Props) {
  return (
    <div
      className={cn(
        "group flex w-full flex-col gap-2",
        from === "user" ? "is-user items-end" : "items-start",
      )}
    >
      {children}
    </div>
  );
}

export function MessageContent({ children }: { children: ReactNode }) {
  return (
    <div className="max-w-[85%] rounded-2xl bg-white/[0.06] px-4 py-2.5 text-sm text-white/90 group-[.is-user]:bg-netflix-red group-[.is-user]:text-white">
      {children}
    </div>
  );
}

export function MessageResponse({ children }: { children: string }) {
  return (
    <div className="prose prose-invert prose-sm max-w-none prose-p:my-1 prose-pre:bg-black/40">
      <Streamdown>{children}</Streamdown>
    </div>
  );
}

export function MessageActions({ children }: { children: ReactNode }) {
  return <div className="flex items-center gap-1 px-1 text-white/50">{children}</div>;
}

export function MessageAction({
  onClick,
  label,
  children,
}: {
  onClick: () => void;
  label: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="rounded p-1 hover:bg-white/10 hover:text-white"
    >
      {children}
    </button>
  );
}
