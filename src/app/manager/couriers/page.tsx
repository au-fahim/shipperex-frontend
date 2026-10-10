import type { Metadata } from "next";
import { ManagerCouriers } from "@/components/operational-pages";
export const metadata: Metadata = {
  title: "Courier roster",
  description: "Review courier availability and task capacity at your hub.",
};
export default function ManagerCouriersPage() {
  return <ManagerCouriers />;
}
