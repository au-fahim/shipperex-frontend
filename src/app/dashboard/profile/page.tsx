import type { Metadata } from "next";
import { CustomerProfile } from "@/components/customer-account-pages";
export const metadata: Metadata = {
  title: "Profile",
  description: "Manage your ShipperEx contact details.",
};
export default function ProfilePage() {
  return <CustomerProfile />;
}
