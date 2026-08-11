export function prefetchUrl(url: string): (() => void) | undefined {
  if (typeof document === "undefined" || !url) return undefined;

  const link = document.createElement("link");

  link.rel = "prefetch";

  link.href = url;

  link.as = "fetch";

  link.crossOrigin = "anonymous";

  document.head.appendChild(link);

  return () => link.remove();
}
