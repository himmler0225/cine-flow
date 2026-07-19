import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  PartyPopper,
  Users,
  MessageSquare,
  Eye,
  Trash2,
  ChevronDown,
  ChevronUp,
  Crown,
} from "lucide-react";
import { toast } from "sonner";
import { getIntlLocale } from "@/lib/i18n";
import { queryKeys } from "@/constants/queryKeys";
import { deleteWatchRoomById } from "@/services/platform/admin/rooms.admin";
import { useAdminRoomDetail, useAdminRooms } from "@/hooks/admin/useAdminRooms";
import type { AdminRoomRow } from "@/types/admin";
import { StatCard } from "@/components/admin/StatCard";
import { Section, SectionEmpty, SectionLoader } from "@/components/admin/Section";
import { ConfirmModal } from "@/components/admin/ConfirmModal";
import { SlidePanel } from "@/components/admin/SlidePanel";
import { getUserInitial } from "@/lib/userDisplay";

export const Route = createFileRoute("/admin/rooms")({
  component: RoomsPage,
});

type RoomRow = AdminRoomRow;

function RoomsPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [openRoom, setOpenRoom] = useState<RoomRow | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<RoomRow | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const { stats, rooms, counts } = useAdminRooms(showHistory);

  const now = Date.now();
  const active = rooms.data?.filter((r) => new Date(r.expires_at).getTime() > now) ?? [];
  const expired = rooms.data?.filter((r) => new Date(r.expires_at).getTime() <= now) ?? [];

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-white">{t("admin.nav.rooms")}</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          icon={<PartyPopper className="h-4 w-4" />}
          label={t("admin.rooms.activeRooms")}
          value={stats.data?.active ?? 0}
          loading={stats.isLoading}
        />
        <StatCard
          icon={<Users className="h-4 w-4" />}
          label={t("admin.rooms.totalMembers")}
          value={stats.data?.members ?? 0}
          loading={stats.isLoading}
        />
        <StatCard
          icon={<MessageSquare className="h-4 w-4" />}
          label={t("admin.rooms.totalMessages")}
          value={stats.data?.msgs ?? 0}
          loading={stats.isLoading}
        />
      </div>

      <Section title={t("admin.rooms.activeRoomsSection", { count: active.length })}>
        {rooms.isLoading ? (
          <SectionLoader />
        ) : active.length === 0 ? (
          <SectionEmpty message={t("admin.rooms.noActiveRooms")} />
        ) : (
          <RoomTable
            rooms={active}
            counts={counts.data}
            onOpen={setOpenRoom}
            onDelete={setConfirmDelete}
          />
        )}
      </Section>

      <Section
        title={t("admin.rooms.roomHistory")}
        action={
          <button
            onClick={() => setShowHistory((v) => !v)}
            className="inline-flex items-center gap-1 rounded border border-white/10 px-2 py-1 text-xs text-zinc-300 hover:bg-white/5"
          >
            {showHistory ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {showHistory ? t("admin.rooms.collapse") : t("admin.rooms.viewHistory")}
          </button>
        }
      >
        {showHistory ? (
          rooms.isLoading ? (
            <SectionLoader />
          ) : expired.length === 0 ? (
            <SectionEmpty message={t("admin.rooms.noExpiredRooms")} />
          ) : (
            <RoomTable
              rooms={expired}
              counts={counts.data}
              expiredMode
              onOpen={setOpenRoom}
              onDelete={setConfirmDelete}
            />
          )
        ) : (
          <p className="text-xs text-zinc-500">{t("admin.rooms.historyHint")}</p>
        )}
      </Section>

      <ConfirmModal
        open={!!confirmDelete}
        title={t("admin.rooms.deleteRoom")}
        message={t("admin.rooms.deleteRoomMessage", { code: confirmDelete?.code })}
        onClose={() => setConfirmDelete(null)}
        onConfirm={async () => {
          if (!confirmDelete) return;
          const { error } = await deleteWatchRoomById(confirmDelete.id);
          if (error) toast.error(t("toast.adminDeleteFailed"), { description: error.message });
          else {
            toast.success(t("toast.adminRoomDeleted"));
            qc.invalidateQueries({ queryKey: queryKeys.admin.all() });
          }
          setConfirmDelete(null);
        }}
      />

      <RoomDetail room={openRoom} onClose={() => setOpenRoom(null)} />
    </div>
  );
}

function RoomTable({
  rooms,
  counts,
  expiredMode,
  onOpen,
  onDelete,
}: {
  rooms: RoomRow[];
  counts?: { memberCount: Record<string, number>; msgCount: Record<string, number> };
  expiredMode?: boolean;
  onOpen: (r: RoomRow) => void;
  onDelete: (r: RoomRow) => void;
}) {
  const { t, i18n } = useTranslation();
  const locale = getIntlLocale(i18n.language);

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="border-b border-white/10 text-xs uppercase tracking-wider text-zinc-500">
          <tr>
            <th className="py-2">{t("admin.common.code")}</th>
            <th>{t("admin.common.movie")}</th>
            <th className="text-right">{t("admin.common.members")}</th>
            <th className="text-right">{t("admin.common.messages")}</th>
            <th>{t("admin.common.created")}</th>
            <th>{expiredMode ? t("admin.common.status") : t("admin.common.expires")}</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {rooms.map((r) => (
            <tr key={r.id} className="border-b border-white/5 hover:bg-white/5">
              <td className="py-2">
                <span className="rounded bg-netflix-red/15 px-1.5 py-0.5 font-mono text-xs font-bold text-netflix-red">
                  {r.code}
                </span>
              </td>
              <td className="truncate text-sm text-white">{r.movie_name ?? r.movie_slug}</td>
              <td className="text-right font-mono text-white">{counts?.memberCount[r.id] ?? 0}</td>
              <td className="text-right font-mono text-white">{counts?.msgCount[r.id] ?? 0}</td>
              <td className="text-xs text-zinc-400">
                {new Date(r.created_at).toLocaleString(locale)}
              </td>
              <td>
                {expiredMode ? (
                  <span className="rounded bg-zinc-700/50 px-1.5 py-0.5 text-[10px] text-zinc-400">
                    {t("admin.common.expired")}
                  </span>
                ) : (
                  <span className="text-xs text-emerald-400">
                    {new Date(r.expires_at).toLocaleTimeString(locale)}
                  </span>
                )}
              </td>
              <td className="text-right">
                <button
                  onClick={() => onOpen(r)}
                  className="rounded p-1 text-zinc-400 hover:bg-white/10 hover:text-white"
                  title={t("admin.common.viewDetails")}
                >
                  <Eye className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => onDelete(r)}
                  className="ml-1 rounded p-1 text-zinc-400 hover:bg-red-500/10 hover:text-red-400"
                  title={t("admin.common.delete")}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RoomDetail({ room, onClose }: { room: RoomRow | null; onClose: () => void }) {
  const { t, i18n } = useTranslation();
  const locale = getIntlLocale(i18n.language);
  const [tab, setTab] = useState<"members" | "messages">("members");
  const roomId = room?.id ?? "";

  const { members, messages } = useAdminRoomDetail(roomId, tab);

  const tabs = [
    ["members", t("admin.common.members")] as const,
    ["messages", t("admin.common.messages")] as const,
  ];

  return (
    <SlidePanel
      open={!!room}
      onClose={onClose}
      width={560}
      title={room ? t("admin.rooms.roomTitle", { code: room.code }) : ""}
    >
      {room && (
        <div className="p-4">
          <div className="mb-4 rounded-lg border border-white/10 bg-white/[0.03] p-3">
            <p className="font-mono text-3xl font-bold tracking-[0.3em] text-netflix-red">
              {room.code}
            </p>
            <p className="mt-1 text-sm text-white">{room.movie_name}</p>
            <p className="text-xs text-zinc-500">
              {t("admin.common.createdAt")} {new Date(room.created_at).toLocaleString(locale)} ·{" "}
              {t("admin.common.expiresAt")} {new Date(room.expires_at).toLocaleString(locale)}
            </p>
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

          {tab === "members" &&
            (members.isLoading ? (
              <SectionLoader />
            ) : (
              <ul className="divide-y divide-white/5">
                {members.data?.map((m) => (
                  <li key={m.id} className="flex items-center gap-2 py-2 text-sm">
                    <div className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-netflix-red text-[11px] font-bold text-white">
                      {m.avatar_url ? (
                        <img src={m.avatar_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        getUserInitial(m.username)
                      )}
                    </div>
                    <span className="flex-1 truncate text-white">{m.username}</span>
                    {m.user_id === room.host_id && (
                      <Crown className="h-3.5 w-3.5 fill-amber-400 stroke-amber-600" />
                    )}
                    <span className="text-[10px] text-zinc-500">
                      {new Date(m.joined_at).toLocaleString(locale)}
                    </span>
                  </li>
                ))}
              </ul>
            ))}

          {tab === "messages" &&
            (messages.isLoading ? (
              <SectionLoader />
            ) : (messages.data?.length ?? 0) === 0 ? (
              <SectionEmpty message={t("admin.rooms.noMessages")} />
            ) : (
              <ul className="space-y-1.5">
                {messages.data?.map((m) => {
                  const typeBadge =
                    m.type === "system"
                      ? "bg-blue-500/15 text-blue-300"
                      : m.type === "reaction"
                        ? "bg-purple-500/15 text-purple-300"
                        : "bg-zinc-700/40 text-zinc-300";
                  return (
                    <li
                      key={m.id}
                      className="flex items-start gap-2 rounded border border-white/5 bg-white/[0.02] p-2 text-xs"
                    >
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-netflix-red text-[10px] font-bold text-white">
                        {getUserInitial(m.username)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-1.5">
                          <span className="font-semibold text-white">{m.username}</span>
                          <span className={`rounded px-1 text-[9px] uppercase ${typeBadge}`}>
                            {m.type}
                          </span>
                          <span className="text-[10px] text-zinc-500">
                            {new Date(m.created_at).toLocaleTimeString(locale)}
                          </span>
                        </p>
                        <p className="break-words text-zinc-200">{m.content}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ))}
        </div>
      )}
    </SlidePanel>
  );
}
