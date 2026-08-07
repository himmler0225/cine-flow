import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  Search,
  MoreVertical,
  ShieldCheck,
  ShieldOff,
  Eye,
  Download,
  Check,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { getIntlLocale } from "@/lib/i18n";
import { getTotalPages } from "@/utils/pagination";
import { queryKeys } from "@/constants/queryKeys";
import { adminUsersApi } from "@/services/platform/admin/users.admin";
import { useAdminUserDetail, useAdminUsers } from "@/hooks/admin/useAdminUsers";
import type { AdminProfileRow } from "@/types/admin";
import { Section, SectionEmpty, SectionLoader } from "@/components/admin/Section";
import { AdminSelect } from "@/components/admin/AdminSelect";
import { ConfirmModal } from "@/components/admin/ConfirmModal";
import { SlidePanel } from "@/components/admin/SlidePanel";
import { getUserInitial } from "@/lib/userDisplay";
import { ROLE, isAdminRole, type AdminUserFilter } from "@/constants/roles";
import { isPremiumPlan } from "@/constants/premium";
import { ADMIN_PAGE_SIZE } from "@/constants/pagination";

export const Route = createFileRoute("/admin/users")({
  component: UsersPage,
});

type ProfileRow = AdminProfileRow;

function UsersPage() {
  const { t, i18n } = useTranslation();
  const locale = getIntlLocale(i18n.language);
  const qc = useQueryClient();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"new" | "name">("new");
  const [filter, setFilter] = useState<AdminUserFilter>("all");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [openUser, setOpenUser] = useState<ProfileRow | null>(null);
  const [confirm, setConfirm] = useState<{
    user: ProfileRow;
    action: "make-admin" | "remove-admin" | "approve" | "reject";
  } | null>(null);
  const { data, isLoading } = useAdminUsers({
    query,
    sort,
    filter,
    page,
    pageSize: ADMIN_PAGE_SIZE,
  });
  const toggleAll = (checked: boolean) => {
    if (!data) return;
    setSelected(checked ? new Set(data.rows.map((r) => r.id)) : new Set());
  };
  const toggleOne = (id: string) => {
    const s = new Set(selected);
    if (s.has(id)) s.delete(id);
    else s.add(id);
    setSelected(s);
  };
  const exportCsv = () => {
    if (!data) return;
    const rows = data.rows.filter((r) => selected.has(r.id));
    const csv = [
      "id,username,role,plan,created_at",
      ...rows.map((r) =>
        [r.id, r.username ?? "", r.role ?? "", r.plan ?? "", r.created_at].join(","),
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const totalPages = getTotalPages(data?.total ?? 0, ADMIN_PAGE_SIZE);
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-white">{t("admin.nav.users")}</h1>
      <Section
        title={t("admin.users.userCount", { count: (data?.total ?? 0).toLocaleString(locale) })}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(0);
                }}
                placeholder={t("admin.users.searchPlaceholder")}
                className="w-52 rounded-md border border-white/10 bg-white/5 py-1.5 pl-7 pr-2 text-xs text-white placeholder:text-zinc-500 focus:border-netflix-red focus:outline-none"
              />
            </div>
            <AdminSelect
              value={sort}
              onValueChange={setSort}
              options={[
                { value: "new", label: t("admin.common.newest") },
                { value: "name", label: t("admin.common.sortNameAZ") },
              ]}
            />
            <AdminSelect
              value={filter}
              onValueChange={(v) => {
                setFilter(v);
                setPage(0);
              }}
              options={[
                { value: "all", label: t("admin.common.filterAll") },
                { value: "pending", label: t("admin.common.filterPending") },
                { value: "free", label: t("admin.common.filterFree") },
                { value: ROLE.PREMIUM, label: t("admin.common.filterPremium") },
                { value: ROLE.ADMIN, label: t("admin.common.filterAdmin") },
              ]}
            />
          </div>
        }
      >
        {isLoading ? (
          <SectionLoader />
        ) : (data?.rows.length ?? 0) === 0 ? (
          <SectionEmpty message={t("admin.users.notFound")} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-white/10 text-xs uppercase tracking-wider text-zinc-500">
                <tr>
                  <th className="py-2">
                    <input
                      type="checkbox"
                      onChange={(e) => toggleAll(e.target.checked)}
                      checked={selected.size > 0 && selected.size === (data?.rows.length ?? 0)}
                    />
                  </th>
                  <th>{t("admin.common.users")}</th>
                  <th>{t("admin.common.role")}</th>
                  <th>{t("admin.common.plan")}</th>
                  <th>{t("admin.common.registered")}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {data?.rows
                  .filter((u) => u.id)
                  .map((u) => (
                    <UserRow
                      key={u.id}
                      user={u}
                      selected={selected.has(u.id)}
                      onToggle={() => toggleOne(u.id)}
                      onOpen={() => setOpenUser(u)}
                      onAdminToggle={() =>
                        setConfirm({
                          user: u,
                          action: isAdminRole(u.role) ? "remove-admin" : "make-admin",
                        })
                      }
                      onApprove={() => setConfirm({ user: u, action: "approve" })}
                      onReject={() => setConfirm({ user: u, action: "reject" })}
                    />
                  ))}
              </tbody>
            </table>

            <div className="mt-3 flex items-center justify-between">
              <p className="text-xs text-zinc-500">
                {t("admin.common.page", { current: page + 1, total: totalPages })}
              </p>
              <div className="flex gap-1">
                <button
                  disabled={page === 0}
                  onClick={() => setPage((p) => p - 1)}
                  className="rounded border border-white/10 bg-white/5 px-2 py-1 text-xs text-white disabled:opacity-40"
                >
                  ←
                </button>
                <button
                  disabled={page + 1 >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded border border-white/10 bg-white/5 px-2 py-1 text-xs text-white disabled:opacity-40"
                >
                  →
                </button>
              </div>
            </div>
          </div>
        )}
      </Section>

      {selected.size > 0 && (
        <div className="fixed bottom-4 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-full border border-white/10 bg-zinc-900 px-4 py-2 shadow-2xl">
          <span className="text-xs text-white">
            {t("admin.common.selected", { count: selected.size })}
          </span>
          <button
            onClick={exportCsv}
            className="inline-flex items-center gap-1.5 rounded bg-netflix-red px-3 py-1.5 text-xs font-semibold text-white hover:bg-netflix-red-hover"
          >
            <Download className="h-3.5 w-3.5" /> {t("admin.common.exportCsv")}
          </button>
        </div>
      )}

      <ConfirmModal
        open={!!confirm}
        title={
          confirm?.action === "make-admin"
            ? t("admin.users.makeAdmin")
            : confirm?.action === "remove-admin"
              ? t("admin.users.removeAdmin")
              : confirm?.action === "approve"
                ? t("admin.users.approve")
                : t("admin.users.reject")
        }
        message={t(
          confirm?.action === "make-admin"
            ? "admin.users.confirmMakeAdmin"
            : confirm?.action === "remove-admin"
              ? "admin.users.confirmRemoveAdmin"
              : confirm?.action === "approve"
                ? "admin.users.confirmApprove"
                : "admin.users.confirmReject",
          { name: confirm?.user.username ?? t("admin.users.thisUser") },
        )}
        onClose={() => setConfirm(null)}
        onConfirm={async () => {
          if (!confirm) return;
          const { error } =
            confirm.action === "approve" || confirm.action === "reject"
              ? await adminUsersApi.updateStatus(
                  confirm.user.id,
                  confirm.action === "approve" ? "approved" : "rejected",
                )
              : await adminUsersApi.updateRole(
                  confirm.user.id,
                  confirm.action === "make-admin" ? ROLE.ADMIN : ROLE.USER,
                );
          if (error) toast.error(t("toast.adminUpdateFailed"), { description: error.message });
          else {
            toast.success(t("toast.adminUpdateSuccess"));
            qc.invalidateQueries({ queryKey: queryKeys.admin.users(query, sort, filter, page) });
          }
          setConfirm(null);
        }}
      />

      <UserDetail user={openUser} onClose={() => setOpenUser(null)} />
    </div>
  );
}

function UserRow({
  user,
  selected,
  onToggle,
  onOpen,
  onAdminToggle,
  onApprove,
  onReject,
}: {
  user: ProfileRow;
  selected: boolean;
  onToggle: () => void;
  onOpen: () => void;
  onAdminToggle: () => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  const { t, i18n } = useTranslation();
  const locale = getIntlLocale(i18n.language);
  const [menu, setMenu] = useState(false);
  const isAdmin = isAdminRole(user.role);
  const isPending = user.status === "pending";
  const isRejected = user.status === "rejected";
  return (
    <tr className="border-b border-white/5 hover:bg-white/5">
      <td className="py-2.5">
        <input type="checkbox" checked={selected} onChange={onToggle} />
      </td>
      <td>
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-netflix-red text-xs font-bold text-white">
            {user.avatar_url ? (
              <img src={user.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              getUserInitial(user.username)
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm text-white">
              {user.username ?? t("admin.common.noName")}
            </p>
            <p className="truncate text-[10px] text-zinc-500 font-mono">
              {user.id ? user.id.slice(0, 8) : "—"}
            </p>
          </div>
        </div>
      </td>
      <td>
        <div className="flex flex-wrap items-center gap-1.5">
          {isAdmin ? (
            <span className="rounded bg-red-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-red-400">
              {t("admin.common.adminRole")}
            </span>
          ) : (
            <span className="rounded bg-zinc-700/40 px-1.5 py-0.5 text-[10px] font-medium text-zinc-300">
              {t("admin.common.user")}
            </span>
          )}
          {isPending && (
            <span className="rounded bg-amber-400/15 px-1.5 py-0.5 text-[10px] font-semibold text-amber-300">
              {t("admin.common.pending")}
            </span>
          )}
          {isRejected && (
            <span className="rounded bg-red-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-red-400">
              {t("admin.common.rejected")}
            </span>
          )}
        </div>
      </td>
      <td>
        {isPremiumPlan(user.plan) ? (
          <span className="rounded bg-amber-400/15 px-1.5 py-0.5 text-[10px] font-semibold text-amber-300">
            {t("admin.common.premium")}
          </span>
        ) : (
          <span className="rounded bg-zinc-700/40 px-1.5 py-0.5 text-[10px] font-medium text-zinc-300">
            {t("admin.common.free")}
          </span>
        )}
      </td>
      <td className="text-xs text-zinc-400">
        {new Date(user.created_at).toLocaleDateString(locale)}
      </td>
      <td className="relative text-right">
        {isPending && (
          <span className="mr-1 inline-flex items-center gap-1">
            <button
              onClick={onApprove}
              title={t("admin.users.approve")}
              className="rounded p-1 text-emerald-400 hover:bg-emerald-500/10"
            >
              <Check className="h-4 w-4" />
            </button>
            <button
              onClick={onReject}
              title={t("admin.users.reject")}
              className="rounded p-1 text-red-400 hover:bg-red-500/10"
            >
              <X className="h-4 w-4" />
            </button>
          </span>
        )}
        <button
          onClick={() => setMenu((v) => !v)}
          className="rounded p-1 text-zinc-400 hover:bg-white/10 hover:text-white"
        >
          <MoreVertical className="h-4 w-4" />
        </button>
        {menu && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenu(false)} />
            <div className="absolute right-2 top-8 z-20 w-48 rounded-md border border-white/10 bg-zinc-900 py-1 shadow-2xl">
              <button
                onClick={() => {
                  onOpen();
                  setMenu(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-zinc-200 hover:bg-white/5"
              >
                <Eye className="h-3.5 w-3.5" /> {t("admin.common.viewDetails")}
              </button>
              <button
                onClick={() => {
                  onAdminToggle();
                  setMenu(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-zinc-200 hover:bg-white/5"
              >
                {isAdmin ? (
                  <>
                    <ShieldOff className="h-3.5 w-3.5" /> {t("admin.users.removeAdmin")}
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-3.5 w-3.5" /> {t("admin.users.makeAdmin")}
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </td>
    </tr>
  );
}

function UserDetail({ user, onClose }: { user: ProfileRow | null; onClose: () => void }) {
  const { t, i18n } = useTranslation();
  const locale = getIntlLocale(i18n.language);
  const [tab, setTab] = useState<"history" | "favorites" | "stats">("history");
  const userId = user?.id ?? "";
  const { history, favorites } = useAdminUserDetail(userId, tab);
  const stats = useMemo(() => {
    if (!history.data) return null;
    const unique = new Set(history.data.map((h) => h.movie_slug));
    const totalSec = history.data.reduce((s, h) => s + (h.progress_sec ?? 0), 0);
    return {
      movies: unique.size,
      episodes: history.data.length,
      hours: Math.round((totalSec / 3600) * 10) / 10,
    };
  }, [history.data]);
  const tabs = [
    ["history", t("admin.users.tabHistory")] as const,
    ["favorites", t("admin.users.tabFavorites")] as const,
    ["stats", t("admin.users.tabStats")] as const,
  ];
  return (
    <SlidePanel
      open={!!user}
      onClose={onClose}
      title={
        user ? t("admin.users.userTitle", { name: user.username ?? t("admin.common.noName") }) : ""
      }
    >
      {user && (
        <div className="p-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-netflix-red text-lg font-bold text-white">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt="" className="h-full w-full object-cover" />
              ) : (
                getUserInitial(user.username)
              )}
            </div>
            <div>
              <p className="text-base font-semibold text-white">
                {user.username ?? t("admin.common.noName")}
              </p>
              <p className="text-xs text-zinc-500">
                {t("admin.common.joined")} {new Date(user.created_at).toLocaleDateString(locale)}
              </p>
            </div>
          </div>

          <div className="mb-3 flex gap-1 border-b border-white/10">
            {tabs.map(([k, l]) => (
              <button
                key={k}
                onClick={() => setTab(k)}
                className={`border-b-2 px-3 py-1.5 text-xs font-medium ${
                  tab === k
                    ? "border-netflix-red text-white"
                    : "border-transparent text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {l}
              </button>
            ))}
          </div>

          {tab === "history" &&
            (history.isLoading ? (
              <SectionLoader />
            ) : (history.data?.length ?? 0) === 0 ? (
              <SectionEmpty message={t("admin.users.noWatchHistory")} />
            ) : (
              <ul className="space-y-2">
                {history.data?.map((h) => (
                  <li
                    key={h.id}
                    className="flex items-center gap-2.5 rounded border border-white/5 bg-white/[0.02] p-2"
                  >
                    {h.thumb_url && (
                      <img src={h.thumb_url} alt="" className="h-10 w-16 rounded object-cover" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-white">{h.movie_name}</p>
                      <p className="text-[10px] text-zinc-500">
                        {h.episode_name} · {new Date(h.watched_at).toLocaleString(locale)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ))}

          {tab === "favorites" &&
            (favorites.isLoading ? (
              <SectionLoader />
            ) : (favorites.data?.length ?? 0) === 0 ? (
              <SectionEmpty message={t("admin.users.noFavorites")} />
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {favorites.data?.map((f) => (
                  <div key={f.id} className="overflow-hidden rounded border border-white/10">
                    {f.thumb_url && (
                      <img src={f.thumb_url} alt="" className="aspect-[2/3] w-full object-cover" />
                    )}
                    <p className="truncate p-1 text-[10px] text-white">{f.movie_name}</p>
                  </div>
                ))}
              </div>
            ))}

          {tab === "stats" && stats && (
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-center">
                <p className="text-xs text-zinc-500">{t("admin.users.moviesWatched")}</p>
                <p className="text-xl font-bold text-white">{stats.movies}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-center">
                <p className="text-xs text-zinc-500">{t("admin.users.episodesWatched")}</p>
                <p className="text-xl font-bold text-white">{stats.episodes}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-center">
                <p className="text-xs text-zinc-500">{t("admin.users.watchHours")}</p>
                <p className="text-xl font-bold text-white">{stats.hours}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </SlidePanel>
  );
}
