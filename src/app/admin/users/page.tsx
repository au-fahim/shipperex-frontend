import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminUsers } from "@/components/admin-console";
export const metadata: Metadata = {
  title: "Users & staff",
  description: "Manage ShipperEx accounts and create hub staff.",
};
export default function AdminUsersPage() {
  return (
    <Suspense
      fallback={
        <div className="loading-panel">
          <span />
          <span />
          <span />
        </div>
      }
    >
      <AdminUsers />
    </Suspense>
  );
}
