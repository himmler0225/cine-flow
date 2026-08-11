import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  User,
  Heart,
  Clock,
  Crown,
  LogOut,
  ShieldCheck,
  Wifi,
  ListPlus,
  Users,
} from "lucide-react";
import { UserAvatar } from "@/components/common/UserAvatar";
import { resolveUserDisplay } from "@/lib/userDisplay";
import { useAuthStore } from "@/store/authStore";
import { useSettingsStore } from "@/store/settingsStore";
import { useNavbarUiStore } from "@/components/layout/store/navbarUiStore";
import { isAdminRole } from "@/constants/roles";

export function UserMenu() {
  const { t } = useTranslation();

  const profile = useAuthStore((s) => s.profile);

  const user = useAuthStore((s) => s.user);

  const signOut = useAuthStore((s) => s.signOut);

  const setOpenJoin = useNavbarUiStore((s) => s.setOpenJoin);

  const [open, setOpen] = useState(false);

  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };

    document.addEventListener("mousedown", onClick);

    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const { displayName } = resolveUserDisplay(user, profile);

  const isAdmin = isAdminRole(profile?.role);

  const dataSaver = useSettingsStore((s) => s.dataSaver);

  const setDataSaver = useSettingsStore((s) => s.setDataSaver);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-center"
        aria-label={t("auth.account")}
      >
        <UserAvatar size="sm" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full z-50 mt-2 min-w-[220px] overflow-hidden rounded-xl border border-white/10 bg-netflix-dark shadow-2xl"
          >
            <div className="border-b border-white/10 p-4">
              <div className="flex items-center gap-3">
                <UserAvatar size="md" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">{displayName}</p>
                  <p className="truncate text-xs text-netflix-muted">{user?.email}</p>
                </div>
              </div>
            </div>
            <div className="py-1">
              <Item
                to="/profile"
                icon={<User className="h-4 w-4" />}
                label={t("auth.profile")}
                onClick={() => setOpen(false)}
              />
              <Item
                to="/profile"
                search={{ tab: "favorites" }}
                icon={<Heart className="h-4 w-4" />}
                label={t("auth.favorites")}
                onClick={() => setOpen(false)}
              />
              <Item
                to="/watchlist"
                icon={<ListPlus className="h-4 w-4" />}
                label={t("auth.watchlist")}
                onClick={() => setOpen(false)}
              />
              <Item
                to="/profile"
                search={{ tab: "history" }}
                icon={<Clock className="h-4 w-4" />}
                label={t("auth.history")}
                onClick={() => setOpen(false)}
              />
              <button
                type="button"
                onClick={() => {
                  setOpen(false);

                  setOpenJoin(true);
                }}
                className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-netflix-text hover:bg-white/5"
              >
                <Users className="h-4 w-4 text-netflix-red" />
                {t("nav.watchParty")}
              </button>
            </div>
            <div className="border-t border-white/10 py-1">
              <button
                type="button"
                onClick={() => setDataSaver(!dataSaver)}
                className="flex w-full items-center justify-between gap-3 px-4 py-2 text-left text-sm text-netflix-text hover:bg-white/5"
              >
                <span className="flex items-center gap-3">
                  <Wifi className="h-4 w-4" />
                  {t("auth.dataSaver")}
                </span>
                <span
                  className={`rounded px-2 py-0.5 text-[10px] font-semibold ${dataSaver ? "bg-netflix-red text-white" : "bg-white/10 text-netflix-muted"}`}
                >
                  {dataSaver ? t("common.on") : t("common.off")}
                </span>
              </button>
            </div>
            {profile?.plan !== "premium" && (
              <div className="border-t border-white/10 py-1">
                <Item
                  to="/premium"
                  icon={<Crown className="h-4 w-4" />}
                  label={t("auth.upgradePremium")}
                  className="text-amber-400"
                  onClick={() => setOpen(false)}
                />
              </div>
            )}
            {isAdmin && (
              <div className="border-t border-white/10 py-1">
                <Item
                  to="/admin/dashboard"
                  icon={<ShieldCheck className="h-4 w-4" />}
                  label={t("auth.adminDashboard")}
                  className="text-orange-400"
                  onClick={() => setOpen(false)}
                />
              </div>
            )}
            <div className="border-t border-white/10 py-1">
              <button
                onClick={() => {
                  setOpen(false);

                  void signOut();
                }}
                className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-netflix-red hover:bg-white/5"
              >
                <LogOut className="h-4 w-4" />
                {t("auth.logout")}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Item({
  to,
  search,
  icon,
  label,
  className,
  onClick,
}: {
  to: string;
  search?: Record<string, string>;
  icon: React.ReactNode;
  label: string;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <Link
      to={to as never}
      search={search as never}
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-2 text-sm text-netflix-text hover:bg-white/5 ${className ?? ""}`}
    >
      {icon}
      {label}
    </Link>
  );
}
