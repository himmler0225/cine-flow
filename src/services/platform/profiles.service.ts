import { platformFetch, type ApiMutationResult } from "@/lib/platformApi";
import type { Profile } from "@/types/database";

export async function fetchProfile(userId: string): Promise<Profile | null> {
  return platformFetch<Profile | null>(`/api/profiles/${userId}`, { auth: false });
}

export async function fetchMyProfile(): Promise<Profile | null> {
  return platformFetch<Profile | null>("/api/profiles/me");
}

export async function updateProfile(
  userId: string,
  data: Partial<Profile>,
): Promise<ApiMutationResult<Profile>> {
  const updated = await platformFetch<Profile>("/api/profiles/me", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  return { data: updated, error: null };
}

export async function ensureOAuthProfile(
  userId: string,
  meta: Record<string, unknown>,
  email?: string | null,
): Promise<Profile | null> {
  try {
    return await fetchMyProfile();
  } catch {
    return fetchProfile(userId);
  }
}

export async function uploadAvatar(
  _userId: string,
  _file: File,
  _options?: { path: string; contentType: string },
): Promise<string> {
  throw new Error("Avatar upload chưa được hỗ trợ — dùng URL trực tiếp.");
}
