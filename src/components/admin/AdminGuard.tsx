import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { t } from "@/lib/i18n";
import { useAuthStore } from "@/store/authStore";
import { isAdminRole } from "@/constants/roles";
import { PageSkeleton } from "@/components/common/PageSkeleton";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, profile, isLoading } = useAuthStore();

  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      void navigate({ to: "/login", search: { redirect: "/admin" } });

      return;
    }

    if (profile && !isAdminRole(profile.role)) {
      toast.error(t("admin.noAccess"));

      void navigate({ to: "/" });
    }
  }, [isAuthenticated, profile, isLoading, navigate]);

  if (isLoading || !profile) {
    return <PageSkeleton />;
  }

  if (!isAuthenticated || !isAdminRole(profile.role)) {
    return <PageSkeleton />;
  }

  return <>{children}</>;
}
