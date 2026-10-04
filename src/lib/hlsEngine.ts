import Hls from "hls.js";

const HLS_MIME = "application/vnd.apple.mpegurl";

function isAppleWebKit(): boolean {
  if (typeof navigator === "undefined") return false;

  const ua = navigator.userAgent;

  // iPadOS reports a Mac UA; tell it apart by touch. Desktop Chrome ("Chrome/") on a
  // touch-enabled Mac is not an iPad (Chrome on iPad says "CriOS/").
  const iOS =
    /iP(hone|ad|od)/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1 && !/Chrome\//.test(ua));

  const desktopSafari = /^((?!chrome|chromium|crios|fxios|edg|android).)*safari/i.test(ua);

  return iOS || desktopSafari;
}

/**
 * Prefer hls.js wherever MSE works and keep native HLS for Apple WebKit (where it is the
 * reliable path) or browsers without MSE. Recent Chrome reports canPlayType(m3u8) = "maybe"
 * but its native pipeline rejects many MPEG-TS streams (MEDIA_ERR_SRC_NOT_SUPPORTED) and
 * would also bypass hls.js-only features: ad skip, quality levels, subtitles.
 */
export function shouldUseNativeHls(video: HTMLVideoElement): boolean {
  if (!video.canPlayType(HLS_MIME)) return false;

  if (!Hls.isSupported()) return true;

  return isAppleWebKit();
}
