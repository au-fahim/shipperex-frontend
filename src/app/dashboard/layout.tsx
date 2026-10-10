import { WorkspaceShell } from "@/components/workspace-shell";
import { requireWorkspaceRole } from "@/lib/role-guard";

export default async function CustomerLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await requireWorkspaceRole("customer");
  return <WorkspaceShell role="customer">{children}</WorkspaceShell>;
}
