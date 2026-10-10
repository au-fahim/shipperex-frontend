import { WorkspaceShell } from "@/components/workspace-shell";
import { requireWorkspaceRole } from "@/lib/role-guard";

export default async function ManagerLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await requireWorkspaceRole("manager");
  return <WorkspaceShell role="manager">{children}</WorkspaceShell>;
}
