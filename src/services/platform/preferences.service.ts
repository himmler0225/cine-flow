import { platformFetch } from "@/lib/platformApi";

export type MoviePlayerPrefs = {
  /** Server tab the viewer picked for this movie (e.g. Vietsub vs Thuyết minh). */
  server?: number;
  speed?: number;
  updatedAt?: number;
};

export type EpisodeSnapshot = Record<string, { episode: string; at: number }>;

export type DanmakuSettings = {
  enabled?: boolean;
  /** 0.2–1 */
  opacity?: number;
  /** Max comments on screen at once. */
  density?: "low" | "medium" | "high";
  /** Comments containing any of these (case-insensitive) are hidden. */
  blocked?: string[];
};

/** Mirrors the backend whitelist in PreferencesService. */
export interface UserPreferences {
  player?: { volume?: number; muted?: boolean };
  moviePrefs?: Record<string, MoviePlayerPrefs>;
  settings?: {
    dataSaver?: boolean;
    skipAds?: boolean;
    /** Skip community-marked intros without asking. */
    autoSkipIntro?: boolean;
    danmaku?: DanmakuSettings;
  };
  recentSearches?: string[];
  episodeSnapshots?: EpisodeSnapshot;
  notifReadAt?: number;
}

class PreferencesApi {
  fetch(): Promise<UserPreferences> {
    return platformFetch<UserPreferences>("/api/preferences");
  }
  async update(data: Partial<UserPreferences>): Promise<void> {
    await platformFetch("/api/preferences", {
      method: "PATCH",
      body: JSON.stringify({ data }),
    });
  }
}

export const preferencesApi = new PreferencesApi();
