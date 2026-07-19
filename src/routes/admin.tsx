import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminLayout } from "@/components/admin/AdminLayout";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [{ title: "Admin Panel — Cine-Flow" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  component: AdminRoot,
});

function AdminRoot() {
  return (
    <AdminGuard>
      <AdminLayout>
        <Outlet />
      </AdminLayout>
    </AdminGuard>
  );
}
