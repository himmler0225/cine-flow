import { Search, Command } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/store/authStore";
import { UserMenu } from "@/components/auth/UserMenu";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { useNavbarUiStore } from "@/components/layout/store/navbarUiStore";

type Props = {
  isAuthenticated: boolean;
};

export function NavToolbar({ isAuthenticated }: Props) {
  const { t } = useTranslation();

  const requestAuth = useAuthStore((s) => s.requestAuth);

  const authLoading = useAuthStore((s) => s.isLoading);

  const setOpenSearch = useNavbarUiStore((s) => s.setOpenSearch);

  return (
    <div className="flex min-w-0 shrink items-center gap-0.5 sm:gap-1.5 md:gap-2">
      <button
        type="button"
        onClick={() => setOpenSearch(true)}
        className="hidden items-center gap-2 rounded border border-white/15 bg-black/40 px-3 py-1.5 text-sm text-netflix-muted hover:border-white/30 lg:flex"
      >
        <Search className="h-4 w-4" />
        <span>{t("nav.search")}</span>
        <span className="ml-2 inline-flex items-center gap-0.5 rounded bg-white/10 px-1.5 py-0.5 text-[10px]">
          <Command className="h-3 w-3" /> K
        </span>
      </button>
      <button
        type="button"
        onClick={() => setOpenSearch(true)}
        className="shrink-0 rounded p-1.5 text-white sm:p-2 lg:hidden"
        aria-label={t("nav.searchAria")}
      >
        <Search className="h-5 w-5" />
      </button>
      <div className="hidden shrink-0 md:block">{isAuthenticated && <NotificationBell />}</div>
      {isAuthenticated ? (
        <UserMenu />
      ) : authLoading ? (
        // Session restore in flight: don't flash "Đăng Nhập" at a signed-in user.
        <span aria-hidden className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-white/10" />
      ) : (
        <button
          type="button"
          onClick={() => requestAuth("login")}
          className="whitespace-nowrap rounded-md bg-netflix-red px-3 py-1.5 text-sm font-medium text-white hover:bg-netflix-red-hover md:px-4 md:py-2"
        >
          {t("nav.login")}
        </button>
      )}
    </div>
  );
}
