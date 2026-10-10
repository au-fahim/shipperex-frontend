import type { Metadata } from "next";
import { ShipmentDetail } from "@/components/shipment-detail";

export const metadata: Metadata = {
  title: "Shipment details",
  description: "View the route, payment status and tracking timeline.",
};

export default async function ShipmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ShipmentDetail id={id} />;
}
