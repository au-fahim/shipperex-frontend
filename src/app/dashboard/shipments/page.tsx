import type { Metadata } from "next";
import { Suspense } from "react";
import { CustomerShipments } from "@/components/customer-shipments";

export const metadata: Metadata = {
  title: "My shipments",
  description: "Search and track your ShipperEx shipments.",
};

export default function MyShipmentsPage() {
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
      <CustomerShipments />
    </Suspense>
  );
}
