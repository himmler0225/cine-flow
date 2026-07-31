import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { detectProvider, subscribeEvents } from "@/lib/iframeSync";
import { extractM3u8Url } from "@/utils/player";

function buildBridgeUrl(m3u8: string, time = 0) {
  const t = Math.max(0, Math.floor(time || 0));
  return `/player-bridge.html?url=${encodeURIComponent(m3u8)}&t=${t}`;
}

export function VideoPlayerEmbed({
  src,
  m3u8,
  initialTime = 0,
  onProgress,
  onLiveTime,
  onEnded,
}: {
  src: string;
  m3u8?: string;
  initialTime?: number;
  onProgress?: (currentSec: number, durationSec: number) => void;
  onLiveTime?: (currentSec: number, durationSec: number) => void;
  onEnded?: () => void;
}) {
  const { t } = useTranslation();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const lastSavedRef = useRef(0);
  const durationRef = useRef(0);
  const [progress, setProgress] = useState(0);
  const playable = m3u8 || extractM3u8Url(src);
  const [iframeSrc, setIframeSrc] = useState(() =>
    playable ? buildBridgeUrl(playable, initialTime) : detectProvider(src).url,
  );
  const usingBridge = iframeSrc.includes("/player-bridge.html");

  useEffect(() => {
    if (!playable) {
      setIframeSrc(detectProvider(src).url);
      return;
    }
    setIframeSrc(buildBridgeUrl(playable, initialTime));
    setProgress(0);
  }, [src, playable, initialTime]);

  const report = (time: number, forceSave = false) => {
    if (!Number.isFinite(time)) return;
    setProgress(time);
    const duration = Math.max(durationRef.current, time + 1);
    durationRef.current = duration;
    onLiveTime?.(time, duration);
    if (!onProgress || time < 5) return;
    const now = Date.now();
    if (!forceSave && now - lastSavedRef.current < 3000) return;
    lastSavedRef.current = now;
    onProgress(time, duration);
  };

  useEffect(() => {
    if (usingBridge) return;
    const info = detectProvider(src);
    const iframe = iframeRef.current;
    if (!iframe || (!onProgress && !onLiveTime)) return;
    return subscribeEvents(iframe, info.provider, {
      onTime: (time) => report(time),
      onPause: (time) => report(time, true),
      onSeek: (time) => report(time, true),
    });
  }, [src, onProgress, onLiveTime, usingBridge, iframeSrc]);

  useEffect(() => {
    const onMessage = (ev: MessageEvent) => {
      const data = ev.data as Record<string, unknown> | string | null;
      let obj: Record<string, unknown> | null = null;
      if (typeof data === "string") {
        try {
          obj = JSON.parse(data) as Record<string, unknown>;
        } catch {
          return;
        }
      } else if (data && typeof data === "object") {
        obj = data;
      }
      if (!obj) return;

      if (obj.source === "cineflow-bridge") {
        if (obj.type === "time") {
          report(Number(obj.currentTime) || 0);
          if (typeof obj.duration === "number" && Number.isFinite(obj.duration)) {
            durationRef.current = obj.duration;
          }
        }
        if (obj.type === "ended") onEnded?.();
        if (obj.type === "error" && playable && usingBridge) {
          setIframeSrc(detectProvider(src).url);
        }
        return;
      }

      if (obj.event === "onStateChange" && obj.info === 0) onEnded?.();
      if (obj.event === "ended" || obj.event === "finish") onEnded?.();
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [onEnded, onLiveTime, onProgress, playable, src, usingBridge]);

  return (
    <div className="w-full overflow-hidden rounded-lg bg-black">
      <div className="relative aspect-video w-full bg-black">
        <iframe
          key={iframeSrc}
          ref={iframeRef}
          src={iframeSrc}
          title={t("player.iframeTitle")}
          className="h-full w-full"
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
        />
      </div>
    </div>
  );
}
