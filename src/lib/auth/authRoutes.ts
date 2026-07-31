const PUBLIC_AUTH_PATHS = new Set(["/login", "/forgot-password", "/reset-password"]);

const PUBLIC_BROWSE_PREFIXES = [
  "/",
  "/movie/",
  "/catalog/",
  "/genre/",
  "/country/",
  "/year/",
  "/search",
  "/actor/",
] as const;

export function isPublicAuthPath(pathname: string): boolean {
  if (PUBLIC_AUTH_PATHS.has(pathname)) return true;
  return pathname.startsWith("/auth/");
}

export function isPublicBrowsePath(pathname: string): boolean {
  if (pathname === "/") return true;
  return PUBLIC_BROWSE_PREFIXES.some(
    (p) => p !== "/" && (pathname === p.replace(/\/$/, "") || pathname.startsWith(p)),
  );
}

export function isPublicPath(pathname: string): boolean {
  return isPublicAuthPath(pathname) || isPublicBrowsePath(pathname);
}

export function buildLoginRedirect(pathname: string, search: string): string | undefined {
  const target = pathname + search;
  return target && target !== "/" ? target : undefined;
}
