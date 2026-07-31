import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Search, ExternalLink, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { getIntlLocale } from "@/lib/i18n";
import { getTotalPages } from "@/utils/pagination";
import { queryKeys } from "@/constants/queryKeys";
import { adminCommentsApi } from "@/services/platform/admin/comments.admin";
import { useAdminCommentsList, useAdminCommentStats } from "@/hooks/admin/useAdminComments";
import { StatCard } from "@/components/admin/StatCard";
import { Section, SectionEmpty, SectionLoader } from "@/components/admin/Section";
import { AdminSelect } from "@/components/admin/AdminSelect";
import { ConfirmModal } from "@/components/admin/ConfirmModal";
import { getUserInitial } from "@/lib/userDisplay";
import { ADMIN_PAGE_SIZE } from "@/constants/pagination";

export const Route = createFileRoute("/admin/comments")({
  component: CommentsPage,
});

function CommentsPage() {
  const { t, i18n } = useTranslation();
  const locale = getIntlLocale(i18n.language);
  const qc = useQueryClient();
  const [query, setQuery] = useState("");
  const [movie, setMovie] = useState("");
  const [sort, setSort] = useState<"new" | "likes">("new");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirm, setConfirm] = useState<{
    ids: string[];
    label: string;
  } | null>(null);
  const stats = useAdminCommentStats();
  const list = useAdminCommentsList({ query, movie, sort, page, pageSize: ADMIN_PAGE_SIZE });
  const totalPages = getTotalPages(list.data?.total ?? 0, ADMIN_PAGE_SIZE);
  const toggleAll = (checked: boolean) => {
    if (!list.data) return;
    setSelected(checked ? new Set(list.data.rows.map((r) => r.id)) : new Set());
  };
  const toggleOne = (id: string) => {
    const s = new Set(selected);
    if (s.has(id)) s.delete(id);
    else s.add(id);
    setSelected(s);
  };
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-white">{t("admin.nav.comments")}</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<span className="text-xs">📅</span>}
          label={t("admin.comments.today")}
          value={stats.data?.today ?? 0}
          loading={stats.isLoading}
        />
        <StatCard
          icon={<span className="text-xs">📊</span>}
          label={t("admin.comments.thisWeek")}
          value={stats.data?.week ?? 0}
          loading={stats.isLoading}
        />
        <StatCard
          icon={<span className="text-xs">📈</span>}
          label={t("admin.comments.last30Days")}
          value={stats.data?.month ?? 0}
          loading={stats.isLoading}
        />
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs text-zinc-400">{t("admin.comments.topCommentedMovie")}</p>
          <p className="mt-2 truncate text-sm font-bold text-white">{stats.data?.topMovie}</p>
        </div>
      </div>

      <Section
        title={t("admin.comments.commentCount", {
          count: (list.data?.total ?? 0).toLocaleString(locale),
        })}
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
                placeholder={t("admin.comments.searchContent")}
                className="w-52 rounded-md border border-white/10 bg-white/5 py-1.5 pl-7 pr-2 text-xs text-white focus:border-netflix-red focus:outline-none"
              />
            </div>
            <input
              value={movie}
              onChange={(e) => {
                setMovie(e.target.value);
                setPage(0);
              }}
              placeholder={t("admin.comments.movieSlugPlaceholder")}
              className="w-32 rounded-md border border-white/10 bg-white/5 px-2 py-1.5 text-xs text-white focus:border-netflix-red focus:outline-none"
            />
            <AdminSelect
              value={sort}
              onValueChange={(v) => setSort(v)}
              options={[
                { value: "new", label: t("admin.common.newest") },
                { value: "likes", label: t("admin.comments.sortLikes") },
              ]}
            />
          </div>
        }
      >
        {list.isLoading ? (
          <SectionLoader />
        ) : (list.data?.rows.length ?? 0) === 0 ? (
          <SectionEmpty message={t("admin.comments.noComments")} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-white/10 text-xs uppercase tracking-wider text-zinc-500">
                <tr>
                  <th className="py-2">
                    <input
                      type="checkbox"
                      onChange={(e) => toggleAll(e.target.checked)}
                      checked={selected.size > 0 && selected.size === (list.data?.rows.length ?? 0)}
                    />
                  </th>
                  <th>{t("admin.common.users")}</th>
                  <th>{t("admin.common.movie")}</th>
                  <th>{t("admin.common.content")}</th>
                  <th className="text-right">{t("admin.common.likes")}</th>
                  <th>{t("admin.common.time")}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {list.data?.rows.map((c) => (
                  <tr key={c.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-2">
                      <input
                        type="checkbox"
                        checked={selected.has(c.id)}
                        onChange={() => toggleOne(c.id)}
                      />
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full bg-netflix-red text-[10px] font-bold text-white">
                          {c.avatar_url ? (
                            <img src={c.avatar_url} alt="" className="h-full w-full object-cover" />
                          ) : (
                            getUserInitial(c.username)
                          )}
                        </div>
                        <span className="text-xs text-white">{c.username}</span>
                      </div>
                    </td>
                    <td>
                      <Link
                        to="/movie/$slug"
                        params={{ slug: c.movie_slug }}
                        target="_blank"
                        className="text-xs text-netflix-red hover:underline"
                      >
                        {c.movie_slug}
                      </Link>
                    </td>
                    <td className="max-w-md truncate text-sm text-zinc-200" title={c.content}>
                      {c.content}
                    </td>
                    <td className="text-right text-xs text-zinc-400">{c.likes ?? 0}</td>
                    <td className="text-xs text-zinc-500">
                      {new Date(c.created_at).toLocaleString(locale)}
                    </td>
                    <td className="text-right">
                      <Link
                        to="/movie/$slug"
                        params={{ slug: c.movie_slug }}
                        target="_blank"
                        className="inline-block rounded p-1 text-zinc-400 hover:bg-white/10 hover:text-white"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                      <button
                        onClick={() =>
                          setConfirm({ ids: [c.id], label: t("admin.comments.oneComment") })
                        }
                        className="ml-1 rounded p-1 text-zinc-400 hover:bg-red-500/10 hover:text-red-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
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
            onClick={() =>
              setConfirm({
                ids: [...selected],
                label: t("admin.comments.nComments", { count: selected.size }),
              })
            }
            className="inline-flex items-center gap-1.5 rounded bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-500"
          >
            <Trash2 className="h-3.5 w-3.5" /> {t("admin.comments.deleteSelected")}
          </button>
        </div>
      )}

      <ConfirmModal
        open={!!confirm}
        title={t("admin.comments.deleteComments")}
        message={t("admin.comments.deleteConfirm", { label: confirm?.label })}
        onClose={() => setConfirm(null)}
        onConfirm={async () => {
          if (!confirm) return;
          const { error } = await adminCommentsApi.deleteByIds(confirm.ids);
          if (error) toast.error(t("toast.adminDeleteFailed"), { description: error.message });
          else {
            toast.success(t("toast.adminDeleteSuccess", { label: confirm.label }));
            setSelected(new Set());
            qc.invalidateQueries({ queryKey: queryKeys.admin.all() });
          }
          setConfirm(null);
        }}
      />
    </div>
  );
}
