import { ShellProvider } from "@/components/layout/shell-context";
import { loadStoreShell } from "@/features/shell/queries";
import { setActiveStoreAction } from "@/features/shell/actions";
import { signOutAction } from "@/features/auth/actions";
import { BrandTheme } from "@/features/shell/brand-theme";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const shell = await loadStoreShell();
  return (
    <ShellProvider value={shell && { ...shell, actions: { setActiveStore: setActiveStoreAction, signOut: signOutAction } }}>
      <BrandTheme color={shell?.tenant?.brand_color ?? null} />
      {children}
    </ShellProvider>
  );
}
