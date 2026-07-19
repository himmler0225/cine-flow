type AuthNavigateOptions = {
  to: string;
  search?: Record<string, string>;
};

let navigateFn: ((opts: AuthNavigateOptions) => void) | null = null;

export function registerAuthNavigator(fn: (opts: AuthNavigateOptions) => void) {
  navigateFn = fn;
}

export function goToAuth(tab: "login" | "register" = "login", redirect?: string) {
  const search: Record<string, string> = {};
  if (tab === "register") search.tab = "register";
  if (redirect) search.redirect = redirect;

  if (navigateFn) {
    navigateFn({ to: "/login", search: Object.keys(search).length ? search : undefined });
    return;
  }

  if (typeof window === "undefined") return;
  const params = new URLSearchParams(search);
  const qs = params.toString();
  window.location.href = qs ? `/login?${qs}` : "/login";
}
