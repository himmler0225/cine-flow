import type { EpisodeServer } from "@/types/movie";
import type { WatchRoom } from "@/types/watchParty";
import { WHITESPACE_PATTERN } from "@/constants/patterns";

export interface WatchPartyPlayable {
  src: string;
  embed: string;
  serverIndex: number;
  usesHls: boolean;
}

function normalize(s: string | null | undefined): string {
  if (!s) return "";
  return s.toString().trim().toLowerCase().replace(WHITESPACE_PATTERN, " ");
}

/** Try exact name, then normalized name, then slug match. */
function findEpisode(episodes: EpisodeServer[], serverIndex: number, episodeName?: string | null) {
  const server = episodes[serverIndex];
  if (!server) return null;
  if (episodeName) {
    const exact = server.server_data.find((e) => e.name === episodeName);
    if (exact) return exact;
    const target = normalize(episodeName);
    const fuzzy = server.server_data.find(
      (e) => normalize(e.name) === target || normalize(e.slug) === target,
    );
    if (fuzzy) return fuzzy;
  }
  return null;
}

/** Prefer HLS (m3u8) — required for auto sync. Scans all servers to find the right episode. */
export function pickWatchPartyPlayable(
  episodes: EpisodeServer[] | undefined,
  room: WatchRoom | null,
): WatchPartyPlayable {
  if (!episodes?.length || !room) {
    return { src: "", embed: "", serverIndex: room?.server_index ?? 0, usesHls: false };
  }

  const preferredIndex = Math.min(Math.max(room.server_index, 0), episodes.length - 1);

  // 1) Try preferred server, by name first.
  const current = findEpisode(episodes, preferredIndex, room.episode_name);
  if (current?.link_m3u8) {
    return {
      src: current.link_m3u8,
      embed: current.link_embed ?? "",
      serverIndex: preferredIndex,
      usesHls: true,
    };
  }

  // 2) Scan ALL servers for an episode matching the room's episode name.
  if (room.episode_name) {
    for (let i = 0; i < episodes.length; i++) {
      const ep = findEpisode(episodes, i, room.episode_name);
      if (ep?.link_m3u8) {
        return {
          src: ep.link_m3u8,
          embed: ep.link_embed ?? "",
          serverIndex: i,
          usesHls: true,
        };
      }
      if (ep?.link_embed) {
        // remember embed fallback at first match
        return {
          src: "",
          embed: ep.link_embed,
          serverIndex: i,
          usesHls: false,
        };
      }
    }
  }

  // 3) Last resort: preferred server's m3u8 with current episode (embed only) — DO NOT
  //    silently fall back to episode 1 on a different server; keep user on the requested episode
  //    even if it's embed-only.
  if (current?.link_embed) {
    return {
      src: "",
      embed: current.link_embed,
      serverIndex: preferredIndex,
      usesHls: false,
    };
  }

  return {
    src: "",
    embed: "",
    serverIndex: preferredIndex,
    usesHls: false,
  };
}
