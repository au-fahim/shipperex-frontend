import type { Metadata } from "next";
import { CourierTaskDetail } from "@/components/courier-tasks";
export const metadata: Metadata = {
  title: "Task details",
  description: "Review your courier task and update its progress.",
};
export default async function CourierTaskPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CourierTaskDetail id={id} />;
}
