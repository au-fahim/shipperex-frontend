import type { Metadata } from "next";
import { CustomerNotifications } from "@/components/customer-account-pages";
export const metadata: Metadata = {
  title: "Notifications",
  description: "See shipment and account updates.",
};
export default function NotificationsPage() {
  return <CustomerNotifications />;
}
