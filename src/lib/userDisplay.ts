import type { Profile } from "@/types/database";
import type { User } from "@/services/platform/auth.service";

export function getUserInitial(name?: string | null): string {
  return (name ?? "?").charAt(0).toUpperCase();
}

export function resolveUserDisplay(user: User | null, profile: Profile | null) {
  const meta = (user?.user_metadata ?? {}) as {
    full_name?: string;
    name?: string;
    username?: string;
    avatar_url?: string;
    picture?: string;
  };
  const displayName =
    profile?.username ||
    meta.full_name ||
    meta.name ||
    meta.username ||
    user?.email?.split("@")[0] ||
    "User";
  const avatarUrl = profile?.avatar_url || meta.avatar_url || meta.picture || null;
  return {
    displayName,
    avatarUrl,
    initial: getUserInitial(displayName),
  };
}
