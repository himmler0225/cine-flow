import { PlayCircle } from "lucide-react";
import type { ChatVideoPreview } from "@/types/chat";

interface Props {
  videos: ChatVideoPreview[];
}

function previewTitle(v: ChatVideoPreview): string {
  return v.title || v.desc || "";
}

function previewThumbnail(v: ChatVideoPreview): string | undefined {
  return v.cover || v.thumbnails?.[0]?.url;
}

function previewHref(v: ChatVideoPreview): string | undefined {
  return v.url || (v.video_id ? `https://www.youtube.com/watch?v=${v.video_id}` : undefined);
}

export function ChatVideoPreviewList({ videos }: Props) {
  if (!videos.length) return null;

  return (
    <div className="mt-2 flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "thin" }}>
      {videos.slice(0, 8).map((v, i) => {
        const href = previewHref(v);

        if (!href) return null;

        const title = previewTitle(v);

        const thumbnail = previewThumbnail(v);

        return (
          <a
            key={v.video_id || `${href}-${i}`}
            href={href}
            target="_blank"
            rel="noreferrer"
            className="group relative w-32 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-white/5"
          >
            <div className="relative aspect-video w-full overflow-hidden bg-black/40">
              {thumbnail ? (
                <img
                  src={thumbnail}
                  alt={title}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                />
              ) : null}
              <PlayCircle className="absolute inset-0 m-auto h-6 w-6 text-white/80 drop-shadow" />
            </div>
            {title ? (
              <p className="line-clamp-2 px-1.5 py-1 text-[10px] leading-tight text-netflix-muted">
                {title}
              </p>
            ) : null}
          </a>
        );
      })}
    </div>
  );
}
