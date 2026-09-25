import { ShellProvider } from "@/components/layout/shell-context";
import { loadAdminShell } from "@/features/shell/queries";
import { signOutAction } from "@/features/auth/actions";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const shell = await loadAdminShell();
  return (
    <ShellProvider value={shell && { ...shell, actions: { signOut: signOutAction } }}>
      {children}
    </ShellProvider>
  );
}
