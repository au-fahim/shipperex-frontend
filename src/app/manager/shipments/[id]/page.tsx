import type { Metadata } from "next";
import { ManagerShipmentDetail } from "@/components/manager-operations";
export const metadata: Metadata = {
  title: "Manage shipment",
  description: "Update hub shipment handoffs and assignments.",
};
export default async function ManagerShipmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ManagerShipmentDetail id={id} />;
}
