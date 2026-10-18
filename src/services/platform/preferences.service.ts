import { platformFetch } from "@/lib/platformApi";

export type MoviePlayerPrefs = {
  /** Server tab the viewer picked for this movie (e.g. Vietsub vs Thuyết minh). */
  server?: number;
  speed?: number;
  updatedAt?: number;
};

export type EpisodeSnapshot = Record<string, { episode: string; at: number }>;

/** Mirrors the backend whitelist in PreferencesService. */
export interface UserPreferences {
  player?: { volume?: number; muted?: boolean };
  moviePrefs?: Record<string, MoviePlayerPrefs>;
  settings?: { dataSaver?: boolean; skipAds?: boolean };
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
