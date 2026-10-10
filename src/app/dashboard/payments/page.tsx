import type { Metadata } from "next";
import { CustomerPayments } from "@/components/customer-account-pages";
export const metadata: Metadata = {
  title: "Payments",
  description: "View ShipperEx shipment payments and Stripe status.",
};
export default function PaymentsPage() {
  return <CustomerPayments />;
}
