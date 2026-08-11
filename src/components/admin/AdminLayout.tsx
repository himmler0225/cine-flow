import { useEffect, useState } from "react";
import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import {
  LayoutDashboard,
  Users,
  Film,
  PartyPopper,
  MessageSquare,
  TrendingUp,
  Bot,
  LogOut,
  ArrowLeft,
  ShieldCheck,
  Menu,
  X,
} from "lucide-react";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { useAuthStore } from "@/store/authStore";

const NAV = [
  { to: "/admin/dashboard", labelKey: "admin.nav.dashboard", icon: LayoutDashboard },
  { to: "/admin/users", labelKey: "admin.nav.users", icon: Users },
  { to: "/admin/movies", labelKey: "admin.nav.movies", icon: Film },
  { to: "/admin/rooms", labelKey: "admin.nav.rooms", icon: PartyPopper },
  { to: "/admin/comments", labelKey: "admin.nav.comments", icon: MessageSquare },
  { to: "/admin/analytics", labelKey: "admin.nav.analytics", icon: TrendingUp },
  { to: "/admin/ai-config", labelKey: "admin.nav.aiConfig", icon: Bot },
] as const;

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();

  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const navigate = useNavigate();

  const { profile, user, signOut } = useAuthStore();

  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  const avatar = profile?.avatar_url ?? "";

  const initial = (profile?.username ?? user?.email ?? "A").charAt(0).toUpperCase();

  const sidebarContent = (
    <>
      <div className="border-b border-white/10 px-4 py-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <BrandLogo linked={false} imgClassName="h-7" />
            <span className="shrink-0 rounded bg-netflix-red/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-netflix-red">
              Admin
            </span>
          </div>
          <button
            onClick={() => setDrawerOpen(false)}
            className="rounded p-1.5 text-zinc-400 hover:bg-white/5 hover:text-white lg:hidden"
            aria-label={t("common.close")}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-3">
        {NAV.map((item) => {
          const Icon = item.icon;

          const active = pathname.startsWith(item.to);

          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "border-l-2 border-netflix-red bg-netflix-red/15 text-netflix-red"
                  : "text-zinc-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4" />
              {t(item.labelKey)}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-3">
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-netflix-red text-sm font-bold">
            {avatar ? <img src={avatar} alt="" className="h-full w-full object-cover" /> : initial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-white">
              {profile?.username ?? "Admin"}
            </p>
            <p className="inline-flex items-center gap-1 text-[10px] text-amber-300">
              <ShieldCheck className="h-3 w-3" /> Admin
            </p>
          </div>
        </div>
        <div className="space-y-1">
          <Link
            to="/"
            className="flex items-center gap-2 rounded px-2 py-1.5 text-xs text-zinc-400 hover:bg-white/5 hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> {t("admin.backToHome")}
          </Link>
          <button
            onClick={() => {
              void signOut().then(() => navigate({ to: "/" }));
            }}
            className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs text-red-400 hover:bg-red-500/10"
          >
            <LogOut className="h-3.5 w-3.5" /> {t("admin.logout")}
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-100">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-white/10 bg-zinc-950 lg:flex">
        {sidebarContent}
      </aside>

      <div
        className={`fixed inset-0 z-40 bg-black/60 transition-opacity lg:hidden ${drawerOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={() => setDrawerOpen(false)}
        aria-hidden
      />
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 max-w-[85vw] flex-col border-r border-white/10 bg-zinc-950 transition-transform lg:hidden ${drawerOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {sidebarContent}
      </aside>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col lg:ml-60">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-white/10 bg-zinc-950/95 px-4 py-3 backdrop-blur lg:hidden">
          <button
            onClick={() => setDrawerOpen(true)}
            className="rounded p-1.5 text-zinc-300 hover:bg-white/5 hover:text-white"
            aria-label={t("admin.nav.dashboard")}
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex min-w-0 items-center gap-2">
            <BrandLogo linked={false} imgClassName="h-6" textClassName="text-base" />
            <span className="shrink-0 rounded bg-netflix-red/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-netflix-red">
              Admin
            </span>
          </div>
        </header>

        <main className="min-w-0 flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
