import { useEffect, useRef, useState, useCallback } from "react";
import type { Socket } from "socket.io-client";
import { watchPartyApi } from "@/services/platform/watchParty.service";
import { getAccessToken } from "@/lib/auth/authToken";
import {
  createWatchPartySocket,
  type WatchPartyBroadcastEvent,
  type WatchPartyPresence,
} from "@/lib/watchParty/watchPartySocket";
import { t } from "@/lib/i18n";
import type { PresenceUser, RoomMessage, WatchRoom } from "@/types/watchParty";

const DRIFT = 2;

export type PlaybackEventType = "PLAY" | "PAUSE" | "SEEK";

export interface PlaybackStateMsg {
  type: PlaybackEventType;
  time: number;
  seq: number;
  updatedAt: number;
}

type BroadcastHandler = (ev: WatchPartyBroadcastEvent, payload: Record<string, unknown>) => void;

type PlaybackHandler = (state: PlaybackStateMsg) => void;

interface Opts {
  room: WatchRoom | null;
  me: {
    userId: string;
    username: string;
    avatar_url: string | null;
  } | null;
  isHost: boolean;
  onBroadcast?: BroadcastHandler;
  onPlaybackEvent?: PlaybackHandler;
  onPlaybackSync?: PlaybackHandler;
  onPresenceChange?: (members: PresenceUser[]) => void;
  onRoomClosed?: () => void;
}

export function useWatchParty({
  room,
  me,
  isHost,
  onBroadcast,
  onPlaybackEvent,
  onPlaybackSync,
  onPresenceChange,
  onRoomClosed,
}: Opts) {
  const [members, setMembers] = useState<PresenceUser[]>([]);

  const [messages, setMessages] = useState<RoomMessage[]>([]);

  const socketRef = useRef<Socket | null>(null);

  const handlerRef = useRef<BroadcastHandler | undefined>(onBroadcast);

  const playbackEventRef = useRef<PlaybackHandler | undefined>(onPlaybackEvent);

  const playbackSyncRef = useRef<PlaybackHandler | undefined>(onPlaybackSync);

  const presenceRef = useRef<((m: PresenceUser[]) => void) | undefined>(onPresenceChange);

  const roomClosedRef = useRef(onRoomClosed);

  useEffect(() => {
    handlerRef.current = onBroadcast;
  }, [onBroadcast]);

  useEffect(() => {
    playbackEventRef.current = onPlaybackEvent;
  }, [onPlaybackEvent]);

  useEffect(() => {
    playbackSyncRef.current = onPlaybackSync;
  }, [onPlaybackSync]);

  useEffect(() => {
    presenceRef.current = onPresenceChange;
  }, [onPresenceChange]);

  useEffect(() => {
    roomClosedRef.current = onRoomClosed;
  }, [onRoomClosed]);

  useEffect(() => {
    if (!room?.id) return;

    watchPartyApi.fetchMessages(room.id).then(setMessages);
  }, [room?.id]);

  useEffect(() => {
    if (!room?.code || !me) return;

    const token = getAccessToken();

    if (!token) return;

    const socket = createWatchPartySocket(token);

    socketRef.current = socket;

    const presence: WatchPartyPresence = {
      userId: me.userId,
      username: me.username,
      avatar_url: me.avatar_url,
      isHost,
      joinedAt: Date.now(),
    };

    socket.on("connect", () => {
      socket.emit("join", { roomCode: room.code, presence });
    });

    socket.on("presence:sync", (list: PresenceUser[]) => {
      setMembers(list);

      presenceRef.current?.(list);
    });

    socket.on("presence:join", (member: PresenceUser) => {
      setMembers((prev) => {
        if (prev.some((m) => m.userId === member.userId)) return prev;

        const next = [...prev, member].sort((a, b) => a.joinedAt - b.joinedAt);

        presenceRef.current?.(next);

        return next;
      });
    });

    socket.on("presence:leave", (payload: { userId?: string; username?: string }) => {
      if (!payload.userId || payload.userId === me.userId) return;

      setMembers((prev) => {
        const next = prev.filter((m) => m.userId !== payload.userId);

        presenceRef.current?.(next);

        return next;
      });

      if (payload.username) {
        const username = payload.username;

        setMessages((m) => [
          ...m,
          {
            id: `sys-${Date.now()}-${Math.random()}`,
            room_id: room.id,
            user_id: payload.userId!,
            username,
            avatar_url: null,
            content: t("watchparty.leftRoom", { username }),
            type: "system",
            created_at: new Date().toISOString(),
          },
        ]);
      }
    });

    socket.on(
      "broadcast",
      (data: { event: WatchPartyBroadcastEvent; payload: Record<string, unknown> }) => {
        handlerRef.current?.(data.event, data.payload ?? {});
      },
    );

    socket.on("playback:event", (state: PlaybackStateMsg) => {
      playbackEventRef.current?.(state);
    });

    socket.on("playback:sync", (state: PlaybackStateMsg) => {
      playbackSyncRef.current?.(state);
    });

    socket.on("message:created", (msg: RoomMessage) => {
      setMessages((m) => (m.some((x) => x.id === msg.id) ? m : [...m, msg]));
    });

    socket.on("room:closed", () => {
      roomClosedRef.current?.();
    });

    socket.connect();

    return () => {
      socket.disconnect();

      socketRef.current = null;
    };
  }, [room?.id, room?.code, me?.userId, me?.username, me?.avatar_url, isHost, me]);

  const broadcast = useCallback(
    (event: WatchPartyBroadcastEvent, payload: Record<string, unknown>) => {
      if (!room?.code) return;

      socketRef.current?.emit("broadcast", { roomCode: room.code, event, payload });
    },
    [room?.code],
  );

  const emitPlaybackEvent = useCallback(
    (type: PlaybackEventType, time: number) => {
      if (!room?.code) return;

      socketRef.current?.emit("playback:event", { roomCode: room.code, type, time });
    },
    [room?.code],
  );

  const sendMessage = useCallback(
    async (content: string, type: RoomMessage["type"] = "message") => {
      if (!room?.id || !me) return;

      const trimmed = content.trim().slice(0, 200);

      if (!trimmed) return;

      await watchPartyApi.insertMessage(
        room.id,
        me.username,
        trimmed,
        type,
        type === "message" ? me.avatar_url : null,
      );
    },
    [room?.id, me],
  );

  const sendSystemMessage = useCallback(
    async (text: string) => {
      if (!room?.id || !me) return;

      await watchPartyApi.insertMessage(room.id, me.username, text, "system");
    },
    [room?.id, me],
  );

  return { members, messages, broadcast, emitPlaybackEvent, sendMessage, sendSystemMessage, DRIFT };
}
