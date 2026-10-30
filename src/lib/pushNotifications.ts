import { pushApi } from "@/services/platform/push.service";

export type PushState =
  /** Browser can't do web push (or it's an iPhone not installed to the home screen). */
  | "unsupported"
  /** iOS Safari: only works after "Add to Home Screen". */
  | "needs-install"
  /** Server has no VAPID keys configured. */
  | "disabled"
  | "denied"
  | "off"
  | "on";

function isIos() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isStandalone() {
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function supported() {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

function urlBase64ToUint8Array(base64: string) {
  const padded = (base64 + "=".repeat((4 - (base64.length % 4)) % 4))
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const raw = atob(padded);

  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

async function registration() {
  const existing = await navigator.serviceWorker.getRegistration("/");

  if (existing) return existing;

  return navigator.serviceWorker.register("/sw.js", { scope: "/" });
}

let publicKeyPromise: Promise<string | null> | null = null;

function publicKey() {
  publicKeyPromise ??= pushApi.publicKey().catch(() => {
    publicKeyPromise = null;

    return null;
  });

  return publicKeyPromise;
}

export async function getPushState(): Promise<PushState> {
  if (typeof window === "undefined") return "unsupported";

  if (!supported()) return isIos() && !isStandalone() ? "needs-install" : "unsupported";

  if (!(await publicKey())) return "disabled";

  if (Notification.permission === "denied") return "denied";

  const reg = await navigator.serviceWorker.getRegistration("/");

  const sub = await reg?.pushManager.getSubscription();

  return sub && Notification.permission === "granted" ? "on" : "off";
}

/** Asks for permission (must run from a click) and registers this device. */
export async function enablePush(): Promise<PushState> {
  const key = await publicKey();

  if (!key) return "disabled";

  const permission = await Notification.requestPermission();

  if (permission !== "granted") return permission === "denied" ? "denied" : "off";

  const reg = await registration();

  await navigator.serviceWorker.ready;

  const sub =
    (await reg.pushManager.getSubscription()) ??
    (await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(key),
    }));

  await pushApi.subscribe(sub.toJSON());

  return "on";
}

export async function disablePush(): Promise<PushState> {
  const reg = await navigator.serviceWorker.getRegistration("/");

  const sub = await reg?.pushManager.getSubscription();

  if (sub) {
    await pushApi.unsubscribe(sub.endpoint).catch(() => undefined);

    await sub.unsubscribe();
  }

  return "off";
}

/**
 * After sign-in, re-register an existing subscription with the account (the same
 * browser may have been used by someone else, or the server copy was pruned).
 */
export async function resyncPushSubscription(): Promise<void> {
  if (!supported() || Notification.permission !== "granted") return;

  const reg = await navigator.serviceWorker.getRegistration("/");

  const sub = await reg?.pushManager.getSubscription();

  if (sub) await pushApi.subscribe(sub.toJSON()).catch(() => undefined);
}
