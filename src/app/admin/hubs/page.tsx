import type { Metadata } from "next";
import { AdminHubs } from "@/components/admin-console";
export const metadata: Metadata = {
  title: "Hub management",
  description: "Create and maintain ShipperEx operating hubs.",
};
export default function AdminHubsPage() {
  return <AdminHubs />;
}
