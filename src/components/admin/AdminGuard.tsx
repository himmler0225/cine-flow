import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { t } from "@/lib/i18n";
import { useAuthStore } from "@/store/authStore";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, profile, isLoading } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      void navigate({ to: "/login", search: { redirect: "/admin" } });
      return;
    }
    if (profile && profile.role !== "admin") {
      toast.error(t("admin.noAccess"));
      void navigate({ to: "/" });
    }
  }, [isAuthenticated, profile, isLoading, navigate]);

  if (isLoading || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-netflix-black">
        <Loader2 className="h-10 w-10 animate-spin text-netflix-red" />
      </div>
    );
  }
  if (!isAuthenticated || profile.role !== "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-netflix-black">
        <Loader2 className="h-10 w-10 animate-spin text-netflix-red" />
      </div>
    );
  }
  return <>{children}</>;
}
