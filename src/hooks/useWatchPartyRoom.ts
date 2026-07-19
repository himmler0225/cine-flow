import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { t as i18nT } from "@/lib/i18n";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/constants/queryKeys";
import {
  deleteWatchRoom,
  fetchRoomMembers,
  fetchWatchRoomFull,
  joinRoomAsGuest,
  removeRoomMember,
  updateRoomPlayback,
} from "@/services/platform/watchParty.service";
import { formatTime } from "@/utils/formatTime";
import { useAuthStore } from "@/store/authStore";
import { movieService } from "@/services/movies";
import { useWatchParty } from "@/hooks/useWatchParty";
import type { SyncedPlayerHandle } from "@/components/watchparty/SyncedPlayer";
import type { FloatingReaction } from "@/components/watchparty/ReactionOverlay";
import { buildRoomUrl } from "@/lib/watchParty/watchParty";
import { pickWatchPartyPlayable } from "@/lib/watchParty/watchPartyPlayback";
import {
  loadRoomState,
  saveRoomState,
  clearRoomState,
  projectedTime,
} from "@/lib/watchParty/watchPartyState";
import type { IframeProvider } from "@/lib/iframeSync";
import type { RoomMemberRow, WatchRoom } from "@/types/watchParty";

export function useWatchPartyRoom(code: string) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, profile, isAuthenticated, requestAuth, isLoading: authLoading } = useAuthStore();
  const playerRef = useRef<SyncedPlayerHandle>(null);
  const [mobileChat, setMobileChat] = useState(false);
  const [roomClosed, setRoomClosed] = useState(false);
  const [iframeInfo, setIframeInfo] = useState<{
    provider: IframeProvider;
    supportsAuto: boolean;
  } | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [closing, setClosing] = useState(false);
  const [reactions, setReactions] = useState<FloatingReaction[]>([]);

  const {
    data: room,
    isLoading,
    refetch,
  } = useQuery<WatchRoom | null>({
    queryKey: queryKeys.watchParty.room(code),
    queryFn: () => fetchWatchRoomFull(code),
    refetchOnWindowFocus: true,
    refetchInterval: 3000,
    refetchIntervalInBackground: false,
  });

  const isHost = !!user && !!room && user.id === room.host_id;
  const expired = room && new Date(room.expires_at).getTime() < Date.now();

  const { data: detail } = useQuery({
    queryKey: queryKeys.watchParty.detail(room?.movie_slug ?? ""),
    queryFn: () => movieService.getMovieDetail(room!.movie_slug),
    enabled: !!room,
  });

  const playable = useMemo(
    () => pickWatchPartyPlayable(detail?.episodes, room ?? null),
    [room, detail],
  );

  const autoSyncActive =
    (!iframeInfo && playable.usesHls) || (iframeInfo != null && iframeInfo.supportsAuto);
  const manualSync = !autoSyncActive;

  const { data: dbMembers = [], refetch: refetchMembers } = useQuery<RoomMemberRow[]>({
    queryKey: queryKeys.watchParty.members(room?.id ?? ""),
    queryFn: () => (room?.id ? fetchRoomMembers(room.id) : []),
    enabled: !!room?.id,
  });

  const me = useMemo(
    () =>
      user
        ? {
            userId: user.id,
            username:
              profile?.username ??
              (user.user_metadata?.full_name as string | undefined) ??
              user.email?.split("@")[0] ??
              i18nT("watchparty.guest"),
            avatar_url:
              profile?.avatar_url ?? (user.user_metadata?.avatar_url as string | null) ?? null,
          }
        : null,
    [user, profile],
  );

  const joinedRef = useRef(false);
  useEffect(() => {
    if (joinedRef.current || !room?.id || !user || !me) return;
    joinedRef.current = true;
    (async () => {
      const joined = await joinRoomAsGuest(
        room.id,
        user.id,
        me.username,
        me.avatar_url,
        room.host_id,
      );
      if (joined) void refetchMembers();
    })();
  }, [room?.id, room?.host_id, user, me, refetchMembers]);

  const onBroadcast = useCallback(
    (ev: string, payload: Record<string, unknown>) => {
      if (ev === "STATE") {
        // Guest applies host's room state immediately (no need to wait for DB poll).
        if (isHost) return;
        queryClient.setQueryData<WatchRoom | null>(queryKeys.watchParty.room(code), (prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            episode_name:
              typeof payload.episodeName === "string" ? payload.episodeName : prev.episode_name,
            server_index:
              typeof payload.serverIndex === "number" ? payload.serverIndex : prev.server_index,
            playback_time:
              typeof payload.playbackTime === "number" ? payload.playbackTime : prev.playback_time,
            is_playing:
              typeof payload.isPlaying === "boolean" ? payload.isPlaying : prev.is_playing,
          };
        });
        // Apply directly to player so guest follows host's seek/play immediately.
        const p = playerRef.current;
        if (p) {
          const t = Number(payload.playbackTime ?? 0);
          if (Math.abs(p.currentTime() - t) > 1.5) p.seek(t);
          if (payload.isPlaying === true && p.paused()) void p.play();
          else if (payload.isPlaying === false && !p.paused()) p.pause();
        }
        return;
      }
      if (ev === "REACTION") {
        const id = `r-${Date.now()}-${Math.random()}`;
        const emoji = String(payload.emoji ?? "❤️");
        const userName = String(payload.user ?? i18nT("watchparty.someone"));
        const x = 15 + Math.random() * 70;
        setReactions((prev) => [...prev, { id, emoji, user: userName, x }]);
        window.setTimeout(() => {
          setReactions((prev) => prev.filter((r) => r.id !== id));
        }, 3000);
        return;
      }
      if (ev === "COUNTDOWN") {
        if (isHost) return;
        const syncTime = Number(payload.currentTime ?? room?.playback_time ?? 0);
        let n = Number(payload.from ?? 3);
        setCountdown(n);
        const id = window.setInterval(() => {
          n -= 1;
          if (n < 0) {
            window.clearInterval(id);
            setCountdown(null);
            const p = playerRef.current;
            if (p) {
              p.seek(syncTime);
              void p.play();
            }
            return;
          }
          setCountdown(n);
        }, 1000);
        return;
      }
      const p = playerRef.current;
      if (!p) return;
      if (isHost) return;
      if (ev === "PLAY") {
        const t = Number(payload.currentTime ?? 0);
        if (Math.abs(p.currentTime() - t) > 2) p.seek(t);
        void p.play();
      } else if (ev === "PAUSE") {
        const t = Number(payload.currentTime ?? 0);
        if (Math.abs(p.currentTime() - t) > 2) p.seek(t);
        p.pause();
      } else if (ev === "SEEK") {
        p.seek(Number(payload.seekTo ?? 0));
      }
    },
    [isHost, room?.playback_time, code, queryClient],
  );

  const onPresenceChange = useCallback(() => {
    // When presence sync fires (someone joined/left), refresh DB member list so
    // the host (and everyone) sees the participant count update in real time
    // even if postgres_changes replication isn't enabled on room_members.
    void refetchMembers();
  }, [refetchMembers]);

  const {
    members: presenceMembers,
    messages,
    broadcast,
    sendMessage,
    sendSystemMessage,
  } = useWatchParty({
    room: room ?? null,
    me,
    isHost,
    onBroadcast,
    onPresenceChange,
    onRoomClosed: () => setRoomClosed(true),
  });

  const onlineIds = useMemo(() => new Set(presenceMembers.map((p) => p.userId)), [presenceMembers]);

  // Merge DB members with presence-only entries so the list updates instantly
  // when guests join, even before the DB insert replicates back.
  const mergedMembers = useMemo<RoomMemberRow[]>(() => {
    if (!room) return dbMembers;
    const map = new Map<string, RoomMemberRow>();
    for (const m of dbMembers) map.set(m.user_id, m);
    for (const p of presenceMembers) {
      if (map.has(p.userId)) continue;
      map.set(p.userId, {
        user_id: p.userId,
        username: p.username,
        avatar_url: p.avatar_url,
        joined_at: new Date(p.joinedAt).toISOString(),
      });
    }
    return Array.from(map.values());
  }, [dbMembers, presenceMembers, room]);

  const hostHasJoined = useMemo(
    () => !!room && mergedMembers.some((m) => m.user_id === room.host_id),
    [room, mergedMembers],
  );
  const hostIsOnline = !!room && onlineIds.has(room.host_id);

  const prevHostOnlineRef = useRef<boolean | null>(null);
  useEffect(() => {
    if (!room || isHost) return;
    const prev = prevHostOnlineRef.current;
    if (prev === null) {
      prevHostOnlineRef.current = hostIsOnline;
      return;
    }
    if (prev && !hostIsOnline) {
      playerRef.current?.pause();
      toast.warning(i18nT("toast.hostLeft"), { duration: 5000 });
      void sendSystemMessage(i18nT("watchparty.system.hostLeft"));
    } else if (!prev && hostIsOnline) {
      toast.success(i18nT("toast.hostReturned"));
      void sendSystemMessage(i18nT("watchparty.system.hostReturned"));
    }
    prevHostOnlineRef.current = hostIsOnline;
  }, [hostIsOnline, room, isHost, sendSystemMessage]);

  const lastEpRef = useRef<string | null>(null);
  useEffect(() => {
    if (!isHost || !room?.episode_name) return;
    if (lastEpRef.current === null) {
      lastEpRef.current = room.episode_name;
      return;
    }
    if (lastEpRef.current !== room.episode_name) {
      lastEpRef.current = room.episode_name;
      void sendSystemMessage(
        i18nT("watchparty.system.switchedEpisode", { episode: room.episode_name }),
      );
    }
  }, [isHost, room?.episode_name, sendSystemMessage]);

  useEffect(() => {
    if (!isHost || !room?.id) return;
    const tick = window.setInterval(() => {
      const p = playerRef.current;
      if (!p) return;
      const state = {
        playbackTime: p.currentTime(),
        isPlaying: !p.paused(),
        episodeName: room.episode_name ?? i18nT("watchparty.episodeDefault"),
        serverIndex: room.server_index,
      };
      void updateRoomPlayback(room.id, state);
      // Push state to every guest immediately via broadcast (works even if
      // Supabase postgres_changes realtime isn't enabled on watch_rooms).
      broadcast("STATE", state as unknown as Record<string, unknown>);
    }, 3000);
    return () => window.clearInterval(tick);
  }, [isHost, room?.id, room?.episode_name, room?.server_index, broadcast]);

  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    if (hydrated || !room) return;
    if (isHost) {
      setHydrated(true);
      return;
    }
    if (!playable.src && !playable.embed) return;

    const t = window.setTimeout(() => {
      const p = playerRef.current;
      if (!p) {
        setHydrated(true);
        return;
      }
      const snap = loadRoomState(code);
      const dbTime = room.playback_time;
      let target = dbTime;
      let playing = room.is_playing;
      if (snap && snap.saved_at > 0) {
        const snapTime = projectedTime(snap);
        if (snapTime > dbTime + 1 || dbTime === 0) {
          target = snapTime;
          playing = snap.is_playing;
        }
      }
      if (target > 0) p.seek(target);
      if (playing) void p.play();
      setHydrated(true);
    }, 800);
    return () => window.clearTimeout(t);
  }, [hydrated, room, playable.src, playable.embed, isHost, code]);

  useEffect(() => {
    if (isHost || !hydrated || !room) return;
    const p = playerRef.current;
    if (!p) return;
    if (Math.abs(p.currentTime() - room.playback_time) > 12) {
      p.seek(room.playback_time);
    }
    if (room.is_playing && p.paused()) void p.play();
    else if (!room.is_playing && !p.paused()) p.pause();
  }, [
    isHost,
    hydrated,
    room?.playback_time,
    room?.is_playing,
    room?.episode_name,
    room?.server_index,
    room,
  ]);

  useEffect(() => {
    if (!room) return;
    saveRoomState(code, {
      episode_name: room.episode_name,
      server_index: room.server_index,
      playback_time: room.playback_time,
      is_playing: room.is_playing,
    });
  }, [code, room?.episode_name, room?.server_index, room?.playback_time, room?.is_playing, room]);

  useEffect(() => {
    if (!iframeInfo) return;
    saveRoomState(code, { sync_mode: iframeInfo.supportsAuto ? "auto" : "manual" });
  }, [code, iframeInfo]);

  const syncPlayback = useCallback(
    (playbackTime: number, isPlaying: boolean) => {
      if (!room?.id) return;
      const state = {
        playbackTime,
        isPlaying,
        episodeName: room.episode_name ?? i18nT("watchparty.episodeDefault"),
        serverIndex: room.server_index,
      };
      void updateRoomPlayback(room.id, state);
      broadcast("STATE", state as unknown as Record<string, unknown>);
    },
    [room?.id, room?.episode_name, room?.server_index, broadcast],
  );

  const hostPlay = useCallback(
    (t: number) => {
      if (!isHost) return;
      broadcast("PLAY", { currentTime: t });
      saveRoomState(code, { playback_time: t, is_playing: true });
      void sendSystemMessage(
        i18nT("watchparty.system.hostPlay", { user: me?.username ?? i18nT("watchparty.host") }),
      );
      syncPlayback(t, true);
    },
    [isHost, broadcast, code, syncPlayback, sendSystemMessage, me?.username],
  );

  const hostPause = useCallback(
    (t: number) => {
      if (!isHost) return;
      broadcast("PAUSE", { currentTime: t });
      saveRoomState(code, { playback_time: t, is_playing: false });
      void sendSystemMessage(
        i18nT("watchparty.system.hostPause", { user: me?.username ?? i18nT("watchparty.host") }),
      );
      syncPlayback(t, false);
    },
    [isHost, broadcast, code, syncPlayback, sendSystemMessage, me?.username],
  );

  const hostSeek = useCallback(
    (t: number) => {
      if (!isHost) return;
      broadcast("SEEK", { seekTo: t });
      const playing = !(playerRef.current?.paused() ?? true);
      saveRoomState(code, { playback_time: t, is_playing: playing });
      void sendSystemMessage(
        i18nT("watchparty.system.hostSeek", {
          user: me?.username ?? i18nT("watchparty.host"),
          time: formatTime(t),
        }),
      );
      syncPlayback(t, playing);
    },
    [isHost, broadcast, code, syncPlayback, sendSystemMessage, me?.username],
  );

  const leave = async () => {
    if (room?.id && user?.id) {
      if (me) await sendSystemMessage(i18nT("watchparty.system.userLeft", { user: me.username }));
      await removeRoomMember(room.id, user.id);
    }
    navigate({ to: "/" });
  };

  const closeRoom = async () => {
    if (!isHost || !room?.id) return;
    if (!window.confirm(i18nT("watchparty.closeRoomConfirm"))) return;
    setClosing(true);
    await sendSystemMessage(i18nT("watchparty.system.roomClosed"));
    const { error } = await deleteWatchRoom(room.id);
    setClosing(false);
    if (error) {
      toast.error(i18nT("toast.roomCloseFailed"), { description: error.message });
      return;
    }
    toast.success(i18nT("toast.roomClosed"));
    clearRoomState(code);
    navigate({
      to: "/watch/$slug",
      params: { slug: room.movie_slug },
      search: { tap: 1, server: 0 },
    });
  };

  const copyInvite = async () => {
    try {
      await navigator.clipboard.writeText(
        i18nT("watchparty.inviteText", {
          movie: room?.movie_name ?? "",
          url: buildRoomUrl(code),
        }),
      );
      toast.success(i18nT("toast.copyInvite"));
    } catch {
      toast.error(i18nT("toast.copyFailedShort"));
    }
  };

  const adjustManualTime = useCallback(
    (delta: number) => {
      if (!isHost || !room) return;
      const next = Math.max(0, room.playback_time + delta);
      syncPlayback(next, room.is_playing);
      saveRoomState(code, { playback_time: next });
      broadcast("SEEK", { seekTo: next });
    },
    [isHost, room, syncPlayback, code, broadcast],
  );

  const startCountdown = useCallback(() => {
    const fromPlayer = playerRef.current?.currentTime() ?? 0;
    const t = fromPlayer > 0.5 ? fromPlayer : (room?.playback_time ?? 0);
    void syncPlayback(t, false);
    broadcast("COUNTDOWN", { from: 3, currentTime: t });
    void sendSystemMessage(
      i18nT("watchparty.system.countdown", { user: me?.username ?? i18nT("watchparty.host") }),
    );

    let n = 3;
    setCountdown(n);
    const id = window.setInterval(() => {
      n -= 1;
      if (n < 0) {
        window.clearInterval(id);
        setCountdown(null);
        hostPlay(t);
        return;
      }
      setCountdown(n);
    }, 1000);
  }, [room?.playback_time, syncPlayback, broadcast, sendSystemMessage, me?.username, hostPlay]);

  return {
    code,
    user,
    me,
    room,
    isLoading,
    authLoading,
    isAuthenticated,
    requestAuth,
    isHost,
    expired,
    playable,
    dbMembers: mergedMembers,
    onlineIds,
    hostHasJoined,
    hostIsOnline,
    playerRef,
    mobileChat,
    setMobileChat,
    roomClosed,
    iframeInfo,
    setIframeInfo,
    countdown,
    closing,
    messages,
    sendMessage,
    broadcast,
    hostPlay,
    hostPause,
    hostSeek,
    leave,
    closeRoom,
    copyInvite,
    startCountdown,
    adjustManualTime,
    manualSync,
    autoSyncActive,
    navigate,
    reactions,
  };
}
