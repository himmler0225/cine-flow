import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { enUS, vi } from "date-fns/locale";
import { toast } from "sonner";
import { Camera, Pencil, Check, X, Crown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { UserAvatar } from "@/components/common/UserAvatar";
import { resolveUserDisplay } from "@/lib/userDisplay";
import { uploadAvatar } from "@/services/platform/profiles.service";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";
import { ProfileStatsRow } from "@/components/profile/ProfileStatsRow";

export function ProfileHeader() {
  const { t, i18n } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const fetchProfile = useAuthStore((s) => s.fetchProfile);

  const dateLocale = i18n.language === "vi" ? vi : enUS;

  const { displayName } = resolveUserDisplay(user, profile);

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(displayName);
  useEffect(() => setName(displayName), [displayName]);

  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const onUpload = async (file: File) => {
    if (!user) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t("profile.errors.avatarSize"));
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const publicUrl = await uploadAvatar(user.id, file, {
        path: `${user.id}/avatar.${ext}`,
        contentType: file.type,
      });
      const url = `${publicUrl}?t=${Date.now()}`;
      await updateProfile({ avatar_url: url });
      await fetchProfile(user.id);
      useAuthStore.getState().setProfile({
        ...(profile ?? { id: user.id, username: null, plan: "free", role: "user" }),
        avatar_url: url,
      });
      toast.success(t("toast.avatarUpdated"));
    } catch (e) {
      toast.error((e as Error).message || t("toast.avatarFailed"));
    } finally {
      setUploading(false);
    }
  };

  const saveName = async () => {
    const v = name.trim();
    if (v.length < 2 || v.length > 30) {
      toast.error(t("profile.errors.nameLength"));
      return;
    }
    try {
      await updateProfile({ username: v });
      toast.success(t("toast.nameUpdated"));
      setEditing(false);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const joined = user?.created_at
    ? format(new Date(user.created_at), i18n.language === "vi" ? "'tháng' M, yyyy" : "MMMM yyyy", {
        locale: dateLocale,
      })
    : "";
  const isPremium = profile?.plan === "premium";

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-700/50 bg-gradient-to-r from-gray-900 to-gray-800 p-4 sm:p-6 md:p-8">
      <div className="flex flex-col items-center gap-4 md:flex-row md:items-start md:gap-6">
        <div
          className="group relative h-20 w-20 shrink-0 cursor-pointer sm:h-24 sm:w-24"
          onClick={() => fileRef.current?.click()}
        >
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onUpload(f);
              e.target.value = "";
            }}
          />
          <UserAvatar size="lg" ring className="pointer-events-none" />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-full bg-black/60 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
            <Camera className="h-5 w-5" />
            {uploading ? t("common.loading") : t("profile.changeAvatar")}
          </div>
        </div>

        <div className="w-full min-w-0 flex-1 text-center md:text-left">
          <div className="flex w-full min-w-0 flex-col items-center gap-2 md:items-start">
            <div className="flex w-full min-w-0 flex-wrap items-center justify-center gap-x-2 gap-y-1.5 md:justify-start">
              {editing ? (
                <>
                  <input
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") void saveName();
                      if (e.key === "Escape") {
                        setEditing(false);
                        setName(displayName);
                      }
                    }}
                    className="min-w-0 w-full max-w-[min(100%,14rem)] rounded-md border border-gray-600 bg-gray-900 px-3 py-1.5 text-base text-white focus:border-netflix-red focus:outline-none sm:max-w-xs sm:text-xl"
                  />
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      onClick={() => void saveName()}
                      className="rounded p-1 text-emerald-400 hover:text-emerald-300"
                      aria-label={t("common.save")}
                    >
                      <Check className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => {
                        setEditing(false);
                        setName(displayName);
                      }}
                      className="rounded p-1 text-gray-400 hover:text-white"
                      aria-label={t("common.cancel")}
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h1 className="max-w-full truncate text-xl font-bold text-white sm:text-2xl">
                    {displayName}
                  </h1>
                  <button
                    onClick={() => setEditing(true)}
                    className="shrink-0 text-gray-400 hover:text-white"
                    aria-label={t("profile.editName")}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                </>
              )}
              <span
                className={cn(
                  "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold",
                  isPremium
                    ? "bg-gradient-to-r from-amber-400 to-yellow-500 text-black"
                    : "bg-gray-700 text-gray-300",
                )}
              >
                {isPremium ? t("profile.premiumPlan") : t("profile.freePlan")}
              </span>
            </div>
            <p className="w-full truncate text-sm text-gray-400">{user?.email}</p>
            {joined && (
              <p className="text-xs text-gray-500">{t("profile.memberSince", { date: joined })}</p>
            )}
            {!isPremium && (
              <button className="mt-1 w-full max-w-xs rounded-lg border border-amber-400/60 px-4 py-2 text-sm font-semibold text-amber-400 transition-colors hover:bg-amber-400/10 sm:w-auto">
                <Crown className="mr-1 inline h-4 w-4" /> {t("profile.upgradePremiumBtn")}
              </button>
            )}
          </div>
        </div>
      </div>

      <ProfileStatsRow />
    </div>
  );
}
