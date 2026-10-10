import type { Metadata } from "next";
import { Suspense } from "react";
import { ManagerShipmentQueue } from "@/components/manager-operations";
export const metadata: Metadata = {
  title: "Shipment queue",
  description: "Review and manage shipment operations at your hub.",
};
export default function ManagerShipmentsPage() {
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
      <ManagerShipmentQueue />
    </Suspense>
  );
}
