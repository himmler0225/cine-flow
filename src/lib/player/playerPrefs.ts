import { readStorageKey, writeStorageKey } from "@/constants/storage";

export type MoviePlayerPrefs = {
  /** Server tab the viewer picked for this movie (e.g. Vietsub vs Thuyết minh). */
  server?: number;
  speed?: number;
  updatedAt?: number;
};

type StoredPrefs = {
  volume?: number;
  muted?: boolean;
  movies?: Record<string, MoviePlayerPrefs>;
};

/** Oldest movies are forgotten past this many entries. */
const MAX_MOVIES = 200;

function read(): StoredPrefs {
  try {
    const raw = readStorageKey("playerPrefs");

    return raw ? (JSON.parse(raw) as StoredPrefs) : {};
  } catch {
    return {};
  }
}

function write(prefs: StoredPrefs): void {
  writeStorageKey("playerPrefs", JSON.stringify(prefs));
}

export function getMoviePrefs(slug: string | undefined): MoviePlayerPrefs {
  if (!slug) return {};

  return read().movies?.[slug] ?? {};
}

export function saveMoviePrefs(slug: string | undefined, patch: MoviePlayerPrefs): void {
  if (!slug || typeof window === "undefined") return;

  const prefs = read();

  const movies = {
    ...prefs.movies,
    [slug]: { ...prefs.movies?.[slug], ...patch, updatedAt: Date.now() },
  };

  const slugs = Object.keys(movies);

  if (slugs.length > MAX_MOVIES) {
    slugs
      .sort((a, b) => (movies[a].updatedAt ?? 0) - (movies[b].updatedAt ?? 0))
      .slice(0, slugs.length - MAX_MOVIES)
      .forEach((s) => delete movies[s]);
  }

  write({ ...prefs, movies });
}

export function getVolumePrefs(): { volume?: number; muted?: boolean } {
  const { volume, muted } = read();

  return { volume, muted };
}

export function saveVolumePrefs(patch: { volume?: number; muted?: boolean }): void {
  if (typeof window === "undefined") return;

  write({ ...read(), ...patch });
}
