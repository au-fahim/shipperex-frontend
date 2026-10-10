import type { Metadata } from "next";
import { Suspense } from "react";
import { CourierTaskList } from "@/components/courier-tasks";
export const metadata: Metadata = {
  title: "My tasks",
  description:
    "View pickup and delivery tasks assigned to your courier profile.",
};
export default function CourierTasksPage() {
  return (
    <Suspense
      fallback={
        <div className="loading-panel">
          <span />
          <span />
          <span />
        </div>
      }
    >
      <CourierTaskList />
    </Suspense>
  );
}
