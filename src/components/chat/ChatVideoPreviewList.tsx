import { PlayCircle } from "lucide-react";
import type { ChatVideoPreview } from "@/types/chat";

interface Props {
  videos: ChatVideoPreview[];
}

export function ChatVideoPreviewList({ videos }: Props) {
  if (!videos.length) return null;
  return (
    <div className="mt-2 flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "thin" }}>
      {videos.slice(0, 8).map((v) => {
        const id = v.video_id;
        if (!id) return null;
        const href = `https://www.youtube.com/watch?v=${id}`;
        return (
          <a
            key={id}
            href={href}
            target="_blank"
            rel="noreferrer"
            className="group relative w-32 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-white/5"
          >
            <div className="relative aspect-video w-full overflow-hidden bg-black/40">
              {v.thumbnail ? (
                <img
                  src={v.thumbnail}
                  alt={v.title || ""}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                />
              ) : null}
              <PlayCircle className="absolute inset-0 m-auto h-6 w-6 text-white/80 drop-shadow" />
            </div>
            {v.title ? (
              <p className="line-clamp-2 px-1.5 py-1 text-[10px] leading-tight text-netflix-muted">
                {v.title}
              </p>
            ) : null}
          </a>
        );
      })}
    </div>
  );
}
