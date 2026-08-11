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

export function pickWatchPartyPlayable(
  episodes: EpisodeServer[] | undefined,
  room: WatchRoom | null,
): WatchPartyPlayable {
  if (!episodes?.length || !room) {
    return { src: "", embed: "", serverIndex: room?.server_index ?? 0, usesHls: false };
  }

  const preferredIndex = Math.min(Math.max(room.server_index, 0), episodes.length - 1);

  const current = findEpisode(episodes, preferredIndex, room.episode_name);

  if (current?.link_m3u8) {
    return {
      src: current.link_m3u8,
      embed: current.link_embed ?? "",
      serverIndex: preferredIndex,
      usesHls: true,
    };
  }

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
        return {
          src: "",
          embed: ep.link_embed,
          serverIndex: i,
          usesHls: false,
        };
      }
    }
  }

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
