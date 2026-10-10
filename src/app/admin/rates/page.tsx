import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminRates } from "@/components/admin-console";
export const metadata: Metadata = {
  title: "Shipment rates",
  description: "Manage export and import price bands.",
};
export default function AdminRatesPage() {
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
      <AdminRates />
    </Suspense>
  );
}
