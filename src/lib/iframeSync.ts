import {
  VIMEO_HOST_PATTERN,
  VIMEO_ORIGIN_PATTERN,
  YOUTUBE_HOST_PATTERN,
  YOUTUBE_ORIGIN_PATTERN,
  YOUTU_BE_HOST_PATTERN,
} from "@/constants/patterns";

export type IframeProvider = "youtube" | "vimeo" | "generic";

export interface IframeSyncInfo {
  provider: IframeProvider;
  supportsAuto: boolean;
  url: string;
}

export function detectProvider(rawUrl: string): IframeSyncInfo {
  if (!rawUrl) return { provider: "generic", supportsAuto: false, url: rawUrl };

  try {
    const u = new URL(rawUrl);

    const host = u.hostname;

    if (YOUTUBE_HOST_PATTERN.test(host) || YOUTU_BE_HOST_PATTERN.test(host)) {
      u.searchParams.set("enablejsapi", "1");

      if (typeof window !== "undefined") {
        u.searchParams.set("origin", window.location.origin);
      }

      return { provider: "youtube", supportsAuto: true, url: u.toString() };
    }

    if (VIMEO_HOST_PATTERN.test(host)) {
      u.searchParams.set("api", "1");

      u.searchParams.set("player_id", "kkflix-player");

      return { provider: "vimeo", supportsAuto: true, url: u.toString() };
    }
  } catch {}

  return { provider: "generic", supportsAuto: false, url: rawUrl };
}

type SyncCmd = "play" | "pause" | "seek";

export function sendCommand(
  iframe: HTMLIFrameElement | null,
  provider: IframeProvider,
  cmd: SyncCmd,
  payload?: {
    time?: number;
  },
): void {
  const win = iframe?.contentWindow;

  if (!win) return;

  const time = payload?.time ?? 0;

  if (provider === "youtube") {
    let func: string;

    let args: unknown[] = [];

    if (cmd === "play") func = "playVideo";
    else if (cmd === "pause") func = "pauseVideo";
    else {
      func = "seekTo";

      args = [time, true];
    }

    win.postMessage(JSON.stringify({ event: "command", func, args }), "*");

    return;
  }

  if (provider === "vimeo") {
    const map: Record<
      SyncCmd,
      {
        method: string;
        value?: number;
      }
    > = {
      play: { method: "play" },
      pause: { method: "pause" },
      seek: { method: "setCurrentTime", value: time },
    };

    win.postMessage(JSON.stringify(map[cmd]), "*");

    return;
  }

  win.postMessage({ type: "KKFLIX_SYNC", cmd, time }, "*");
}

interface SubscribeHandlers {
  onPlay?: (t: number) => void;
  onPause?: (t: number) => void;
  onSeek?: (t: number) => void;
  onTime?: (t: number) => void;
}

export function subscribeEvents(
  iframe: HTMLIFrameElement | null,
  provider: IframeProvider,
  handlers: SubscribeHandlers,
): () => void {
  if (!iframe || provider === "generic") return () => {};

  if (provider === "youtube") {
    const ready = () => {
      iframe.contentWindow?.postMessage(
        JSON.stringify({ event: "listening", id: "kkflix-player" }),
        "*",
      );

      iframe.contentWindow?.postMessage(
        JSON.stringify({ event: "command", func: "addEventListener", args: ["onStateChange"] }),
        "*",
      );
    };

    iframe.addEventListener("load", ready);

    ready();
  }

  let lastTime = 0;

  const onMessage = (ev: MessageEvent) => {
    if (provider === "youtube" && !YOUTUBE_ORIGIN_PATTERN.test(ev.origin)) return;

    if (provider === "vimeo" && !VIMEO_ORIGIN_PATTERN.test(ev.origin)) return;

    let data: unknown = ev.data;

    if (typeof data === "string") {
      try {
        data = JSON.parse(data);
      } catch {
        return;
      }
    }

    const obj = data as Record<string, unknown>;

    if (!obj) return;

    if (provider === "youtube") {
      if (obj.event === "infoDelivery") {
        const info = obj.info as
          | {
              currentTime?: number;
              playerState?: number;
            }
          | undefined;

        if (info?.currentTime != null) {
          lastTime = info.currentTime;

          handlers.onTime?.(info.currentTime);
        }

        if (info?.playerState === 1) handlers.onPlay?.(lastTime);
        else if (info?.playerState === 2) handlers.onPause?.(lastTime);
      } else if (obj.event === "onStateChange") {
        const state = obj.info as number;

        if (state === 1) handlers.onPlay?.(lastTime);
        else if (state === 2) handlers.onPause?.(lastTime);
      }
    } else if (provider === "vimeo") {
      const seconds =
        (
          obj.data as
            | {
                seconds?: number;
              }
            | undefined
        )?.seconds ?? lastTime;

      if (typeof seconds === "number") lastTime = seconds;

      if (obj.event === "play") handlers.onPlay?.(lastTime);
      else if (obj.event === "pause") handlers.onPause?.(lastTime);
      else if (obj.event === "seeked") handlers.onSeek?.(lastTime);
      else if (obj.event === "playProgress" || obj.event === "timeupdate")
        handlers.onTime?.(lastTime);
    }
  };

  window.addEventListener("message", onMessage);

  return () => window.removeEventListener("message", onMessage);
}
