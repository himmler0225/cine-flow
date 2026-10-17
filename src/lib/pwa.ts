/** Registers the service worker in production builds only (dev HMR breaks under a SW). */
export function registerServiceWorker() {
  if (!import.meta.env.PROD || typeof window === "undefined") return;

  if (!("serviceWorker" in navigator)) return;

  const register = () => {
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
      // Non-critical: the site works the same without offline support.
    });
  };

  if (document.readyState === "complete") register();
  else window.addEventListener("load", register, { once: true });
}
