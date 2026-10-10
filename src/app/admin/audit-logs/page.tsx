import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminAuditLogs } from "@/components/admin-console";
export const metadata: Metadata = {
  title: "Audit trail",
  description: "Review actions recorded by the ShipperEx backend.",
};
export default function AdminAuditPage() {
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
      <AdminAuditLogs />
    </Suspense>
  );
}
