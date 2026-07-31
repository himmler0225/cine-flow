import { lazy, Suspense } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useWatchPartyRoom } from "@/hooks/useWatchPartyRoom";
import {
  WatchPartyAuthGate,
  WatchPartyExpired,
  WatchPartyLoading,
  WatchPartyNotFound,
} from "@/components/watchparty/WatchPartyGateStates";
import { WatchPartyPinGate } from "@/components/watchparty/WatchPartyPinGate";
import { t } from "@/lib/i18n";

const WatchPartyRoomView = lazy(() =>
  import("@/components/watchparty/WatchPartyRoomView").then((m) => ({
    default: m.WatchPartyRoomView,
  })),
);

export const Route = createFileRoute("/watch-party/$code")({
  head: ({ params }) => ({
    meta: [
      { title: t("watchparty.pageTitle", { code: params.code }) },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: WatchPartyPage,
});

function WatchPartyPage() {
  const { code } = Route.useParams();
  const state = useWatchPartyRoom(code);
  if (!state.authLoading && !state.isAuthenticated) {
    return <WatchPartyAuthGate code={code} onLogin={() => state.requestAuth("login")} />;
  }
  if (state.isLoading) {
    return <WatchPartyLoading />;
  }
  if (!state.room) {
    return <WatchPartyNotFound code={code} />;
  }
  if (state.expired) {
    return (
      <WatchPartyExpired
        code={code}
        movieSlug={state.room.movie_slug}
        movieName={state.room.movie_name}
      />
    );
  }
  if (state.joinStatus === "need-pin") {
    return (
      <WatchPartyPinGate
        code={code}
        pending={state.pinSubmitting}
        error={state.pinError}
        onSubmit={(pin) => void state.submitPin(pin)}
      />
    );
  }
  if (state.joinStatus !== "joined") {
    return <WatchPartyLoading />;
  }
  return (
    <Suspense fallback={<WatchPartyLoading />}>
      <WatchPartyRoomView state={state} />
    </Suspense>
  );
}
