import { WorkspaceShell } from "@/components/workspace-shell";
import { requireWorkspaceRole } from "@/lib/role-guard";

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await requireWorkspaceRole("admin");
  return <WorkspaceShell role="admin">{children}</WorkspaceShell>;
}
