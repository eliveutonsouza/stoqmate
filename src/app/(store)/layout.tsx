import { ShellProvider } from "@/components/layout/shell-context";
import { loadStoreShell } from "@/features/shell/queries";
import { setActiveStoreAction } from "@/features/shell/actions";
import { signOutAction } from "@/features/auth/actions";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const shell = await loadStoreShell();
  return (
    <ShellProvider value={shell && { ...shell, actions: { setActiveStore: setActiveStoreAction, signOut: signOutAction } }}>
      {children}
    </ShellProvider>
  );
}
