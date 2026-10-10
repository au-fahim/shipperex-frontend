import type { Metadata } from "next";
import { ShipmentReports } from "@/components/operational-pages";
export const metadata: Metadata = {
  title: "Hub shipment report",
  description: "See real shipment volume and outcomes for your hub.",
};
export default function ManagerReportsPage() {
  return <ShipmentReports />;
}
