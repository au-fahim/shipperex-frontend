import { WorkspaceShell } from "@/components/workspace-shell";
import { requireWorkspaceRole } from "@/lib/role-guard";

export default async function CourierLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await requireWorkspaceRole("courier");
  return <WorkspaceShell role="courier">{children}</WorkspaceShell>;
}
