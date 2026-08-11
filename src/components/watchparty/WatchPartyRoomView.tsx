import { TooltipProvider } from "@/components/ui/tooltip";
import { MemberList } from "@/components/watchparty/MemberList";
import { RoomChat } from "@/components/watchparty/RoomChat";
import { WatchPartyRoomHeader } from "@/components/watchparty/WatchPartyRoomHeader";
import { WatchPartyPlayerSection } from "@/components/watchparty/WatchPartyPlayerSection";
import { WatchPartyMobileChat } from "@/components/watchparty/WatchPartyMobileChat";
import { WatchPartyClosedOverlay } from "@/components/watchparty/WatchPartyClosedOverlay";
import type { useWatchPartyRoom } from "@/hooks/useWatchPartyRoom";

type RoomState = ReturnType<typeof useWatchPartyRoom>;

type Props = {
  state: RoomState;
};

export function WatchPartyRoomView({ state }: Props) {
  const {
    room,
    user,
    me,
    isHost,
    playable,
    dbMembers,
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
    navigate,
    reactions,
    onPlayerReady,
  } = state;

  if (!room) return null;

  const waitingForHost = !isHost && !hostHasJoined && !room.is_playing;

  const hostAwayOverlay = !isHost && hostHasJoined && !hostIsOnline && !room.is_playing;

  const chatPanel = (
    <RoomChat
      messages={messages}
      meId={user?.id}
      onSend={(c) => sendMessage(c)}
      onReact={(emoji) => {
        broadcast("REACTION", { emoji, user: me?.username });

        void sendMessage(emoji, "reaction");
      }}
      disabled={!user}
    />
  );

  return (
    <TooltipProvider delayDuration={300}>
      <div className="min-h-screen bg-netflix-black pt-16">
        <div className="px-3 pb-8 md:px-8 lg:px-12">
          <WatchPartyRoomHeader
            room={room}
            isHost={isHost}
            closing={closing}
            onCopyInvite={copyInvite}
            onCloseRoom={closeRoom}
            onLeave={leave}
          />

          <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
            <WatchPartyPlayerSection
              room={room}
              playable={playable}
              isHost={isHost}
              playerRef={playerRef}
              countdown={countdown}
              reactions={reactions}
              waitingForHost={waitingForHost}
              hostAwayOverlay={hostAwayOverlay}
              iframeInfo={iframeInfo}
              manualSync={manualSync}
              onPlay={hostPlay}
              onPause={hostPause}
              onSeek={hostSeek}
              onProviderReady={setIframeInfo}
              onReady={onPlayerReady}
              onLeave={leave}
              onStartCountdown={startCountdown}
              onAdjustTime={adjustManualTime}
              onBroadcastPlay={() => hostPlay(room.playback_time)}
              onBroadcastPause={() => hostPause(room.playback_time)}
            />

            <aside
              className="hidden flex-col gap-3 lg:flex"
              style={{ height: "calc(100vh - 8rem)" }}
            >
              <MemberList
                members={dbMembers}
                hostId={room.host_id}
                meId={user?.id}
                onlineIds={onlineIds}
              />
              <div className="min-h-0 flex-1">{chatPanel}</div>
            </aside>
          </div>

          <div className="mt-3 lg:hidden">
            <MemberList
              members={dbMembers}
              hostId={room.host_id}
              meId={user?.id}
              onlineIds={onlineIds}
            />
          </div>
        </div>

        <WatchPartyMobileChat
          open={mobileChat}
          onOpenChange={setMobileChat}
          messageCount={messages.length}
          chatPanel={chatPanel}
        />

        {roomClosed && (
          <WatchPartyClosedOverlay
            onBack={() => navigate({ to: "/movie/$slug", params: { slug: room.movie_slug } })}
          />
        )}
      </div>
    </TooltipProvider>
  );
}
