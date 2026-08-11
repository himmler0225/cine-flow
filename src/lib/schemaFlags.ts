type Flags = {
  watchHistoryThumbUrl: boolean;
  watchHistoryEpisodeIndex: boolean;
  favoritesCreatedAt: boolean;
  commentsAvatarUrl: boolean;
  commentsSpoiler: boolean;
  commentsEpisodeName: boolean;
};

const STORAGE_KEY = "schema_flags_v2";

function load(): Flags {
  const defaults: Flags = {
    watchHistoryThumbUrl: true,
    watchHistoryEpisodeIndex: true,
    favoritesCreatedAt: true,
    commentsAvatarUrl: true,
    commentsSpoiler: true,
    commentsEpisodeName: true,
  };

  if (typeof window === "undefined") return defaults;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) return defaults;

    const parsed = JSON.parse(raw) as Partial<Flags>;

    return {
      watchHistoryThumbUrl: parsed.watchHistoryThumbUrl ?? true,
      watchHistoryEpisodeIndex: parsed.watchHistoryEpisodeIndex ?? true,
      favoritesCreatedAt: parsed.favoritesCreatedAt ?? true,
      commentsAvatarUrl: parsed.commentsAvatarUrl ?? true,
      commentsSpoiler: parsed.commentsSpoiler ?? true,
      commentsEpisodeName: parsed.commentsEpisodeName ?? true,
    };
  } catch {
    return defaults;
  }
}

export const schemaFlags: Flags = load();

function persist() {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(schemaFlags));
  } catch {}
}

export function markMissing(key: keyof Flags) {
  if (schemaFlags[key]) {
    schemaFlags[key] = false;

    persist();

    console.warn(`[schema] disabling "${key}" — apply docs/fix-missing-columns.sql to re-enable`);
  }
}

export function isMissingColumnError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;

  const e = err as {
    code?: string;
    message?: string;
  };

  if (e.code === "42703" || e.code === "PGRST204") return true;

  const msg = (e.message || "").toLowerCase();

  return msg.includes("does not exist") || msg.includes("schema cache");
}
