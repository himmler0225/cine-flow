import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { AnimatePresence, motion } from "framer-motion";
import { t } from "@/lib/i18n";
import { useAuthStore } from "@/store/authStore";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileTabBar } from "@/components/profile/ProfileTabBar";
import { ProfileOverviewTab } from "@/components/profile/ProfileOverviewTab";
import { ProfileFavoritesTab } from "@/components/profile/ProfileFavoritesTab";
import { ProfileHistoryTab } from "@/components/profile/ProfileHistoryTab";
import { ProfileWatchlistsTab } from "@/components/profile/ProfileWatchlistsTab";
import { ProfilePageSkeleton } from "@/components/profile/ProfilePageSkeleton";

const searchSchema = z.object({
  tab: fallback(z.enum(["overview", "favorites", "watchlists", "history"]), "overview").default(
    "overview",
  ),
});

export const Route = createFileRoute("/profile")({
  validateSearch: zodValidator(searchSchema),
  ssr: false,
  head: () => ({
    meta: [{ title: t("seo.profileTitle") }, { name: "robots", content: "noindex, nofollow" }],
  }),
  component: ProfilePage,
  pendingComponent: ProfilePageSkeleton,
});

function ProfilePage() {
  const { tab } = Route.useSearch();

  const navigate = useNavigate();

  const isAuth = useAuthStore((s) => s.isAuthenticated);

  const isLoading = useAuthStore((s) => s.isLoading);

  const initialize = useAuthStore((s) => s.initialize);

  const requestAuth = useAuthStore((s) => s.requestAuth);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  useEffect(() => {
    if (!isLoading && !isAuth) {
      requestAuth("login");

      navigate({ to: "/", replace: true });
    }
  }, [isAuth, isLoading, requestAuth, navigate]);

  if (isLoading || !isAuth) {
    return <ProfilePageSkeleton />;
  }

  const setTab = (t: string) =>
    navigate({ to: "/profile", search: { tab: t as never }, replace: true });

  return (
    <div className="min-h-screen bg-netflix-black pt-20 pb-8 md:pb-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mx-auto max-w-6xl px-4 md:px-8"
      >
        <ProfileHeader />
        <ProfileTabBar active={tab} onChange={setTab} />
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="mt-6"
          >
            {tab === "overview" && <ProfileOverviewTab />}
            {tab === "favorites" && <ProfileFavoritesTab />}
            {tab === "watchlists" && <ProfileWatchlistsTab />}
            {tab === "history" && <ProfileHistoryTab />}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
