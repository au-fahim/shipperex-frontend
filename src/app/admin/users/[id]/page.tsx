import type { Metadata } from "next";
import { AdminUserDetail } from "@/components/admin-console";
export const metadata: Metadata = {
  title: "Account details",
  description: "Manage account access and review user profile details.",
};
export default async function AdminUserDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AdminUserDetail id={id} />;
}
