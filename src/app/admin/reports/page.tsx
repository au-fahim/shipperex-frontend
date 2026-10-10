import type { Metadata } from "next";
import { ShipmentReports } from "@/components/operational-pages";
export const metadata: Metadata = {
  title: "Network reports",
  description: "See live shipment and network reports.",
};
export default function AdminReportsPage() {
  return <ShipmentReports admin />;
}
