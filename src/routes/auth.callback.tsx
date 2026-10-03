import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { LEADING_HASH_PATTERN } from "@/constants/patterns";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { authApi } from "@/services/platform/auth.service";
import { profilesApi } from "@/services/platform/profiles.service";
import { useAuthStore } from "@/store/authStore";
import { applySessionTokens, clearAuthTokens } from "@/lib/auth/authToken";

export const Route = createFileRoute("/auth/callback")({
  component: AuthCallbackPage,
});

function AuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    const finish = (
      to: "/" | "/login",
      message?: {
        type: "error" | "success";
        text: string;
      },
    ) => {
      if (cancelled) return;

      if (message?.type === "error") toast.error(message.text);

      if (message?.type === "success") toast.success(message.text);

      navigate({ to, replace: true });
    };

    (async () => {
      try {
        const query = new URLSearchParams(window.location.search);

        const hash = new URLSearchParams(window.location.hash.replace(LEADING_HASH_PATTERN, ""));

        const oauthError = query.get("error");

        if (oauthError) {
          const messages: Record<string, string> = {
            oauth_denied: "Đăng nhập Google bị hủy.",
            oauth_failed: "Đăng nhập Google thất bại.",
            account_pending:
              "Tài khoản của bạn đang chờ quản trị viên duyệt. Vui lòng đăng nhập lại sau khi được duyệt.",
            account_rejected: "Yêu cầu đăng ký của bạn đã bị từ chối.",
            oauth_not_configured:
              "Chưa cấu hình Google OAuth trên backend. Thêm GOOGLE_CLIENT_ID và GOOGLE_CLIENT_SECRET vào .env của movie-aggregator-api.",
          };

          finish("/login", {
            type: "error",
            text: messages[oauthError] ?? "Đăng nhập Google thất bại.",
          });

          return;
        }

        const tokenFromHash = hash.get("access_token");

        const refreshFromHash = hash.get("refresh_token");

        if (!tokenFromHash) {
          finish("/login", { type: "error", text: "Không nhận được token đăng nhập. Thử lại." });

          return;
        }

        applySessionTokens({
          access_token: tokenFromHash,
          refresh_token: refreshFromHash ?? undefined,
        });

        window.history.replaceState(null, "", window.location.pathname);

        const session = await authApi.getSession();

        if (!session) {
          clearAuthTokens();

          finish("/login", { type: "error", text: "Phiên đăng nhập không hợp lệ. Thử lại." });

          return;
        }

        useAuthStore.getState().setSession(session);

        try {
          const profile = await profilesApi.fetchMine();

          if (profile) {
            useAuthStore.getState().setProfile(profile);

            useAuthStore.getState().setSession({
              ...session,
              user: {
                ...session.user,
                user_metadata: {
                  ...session.user.user_metadata,
                  avatar_url: profile.avatar_url ?? session.user.user_metadata?.avatar_url,
                  picture: profile.avatar_url ?? session.user.user_metadata?.picture,
                  full_name: profile.username ?? session.user.user_metadata?.full_name,
                },
              },
            });
          }
        } catch (error) {
          console.warn("[auth-callback] profile fetch failed", error);
        }

        finish("/", { type: "success", text: "Đăng nhập thành công!" });
      } catch (err) {
        clearAuthTokens();

        const message = err instanceof Error ? err.message : "Đăng nhập thất bại.";

        finish("/login", { type: "error", text: message });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-netflix-black">
      <div className="text-center text-white">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-netflix-red" />
        <p className="mt-4 text-sm text-netflix-muted">Đang đăng nhập...</p>
      </div>
    </div>
  );
}
