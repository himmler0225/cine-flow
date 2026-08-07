import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useAuthStore } from "@/store/authStore";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();
  const navigate = useNavigate();
  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      void navigate({ to: "/login", search: { redirect: "/" } });
    }
  }, [isAuthenticated, isLoading, navigate]);
  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-netflix-black">
        <Loader2 className="h-10 w-10 animate-spin text-netflix-red" />
      </div>
    );
  }
  return <>{children}</>;
}
