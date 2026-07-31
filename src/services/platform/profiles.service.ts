import { platformFetch, type ApiMutationResult } from "@/lib/platformApi";
import type { Profile } from "@/types/database";

class ProfilesApi {
  fetchById(userId: string): Promise<Profile | null> {
    return platformFetch<Profile | null>(`/api/profiles/${userId}`, { auth: false });
  }
  fetchMine(): Promise<Profile | null> {
    return platformFetch<Profile | null>("/api/profiles/me");
  }
  async update(data: Partial<Profile>): Promise<ApiMutationResult<Profile>> {
    const updated = await platformFetch<Profile>("/api/profiles/me", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    return { data: updated, error: null };
  }
  upgradeToPremium(): Promise<Profile> {
    return platformFetch<Profile>("/api/profiles/me/upgrade-premium", { method: "PATCH" });
  }
  uploadAvatar(_file: File): Promise<string> {
    throw new Error("Avatar upload chưa được hỗ trợ — dùng URL trực tiếp.");
  }
}

export const profilesApi = new ProfilesApi();
