/** Routes accessible without logging in — auth flows only. */
const PUBLIC_AUTH_PATHS = new Set(["/login", "/forgot-password", "/reset-password"]);

export function isPublicAuthPath(pathname: string): boolean {
  if (PUBLIC_AUTH_PATHS.has(pathname)) return true;
  return pathname.startsWith("/auth/");
}

export function buildLoginRedirect(pathname: string, search: string): string | undefined {
  const target = pathname + search;
  return target && target !== "/" ? target : undefined;
}
