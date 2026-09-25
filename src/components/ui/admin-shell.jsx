"use client";

import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import { AppFrame } from '@/components/layout/app-frame';
import { AdminSidebar } from '@/components/layout/admin-sidebar';
import { AppHeader } from '@/components/layout/app-header';

const CommandPalette = dynamic(
  () => import('@/components/ui/command-palette').then(m => m.CommandPalette),
  { ssr: false }
);

export function AdminShell({ breadcrumb, navigate, headerActions, children }) {
  const pathname = usePathname();
  return (
    <AppFrame
      sidebar={<AdminSidebar route={pathname} navigate={navigate} />}
      renderHeader={(menu) => (
        <AppHeader breadcrumb={['Console', ...breadcrumb]} navigate={navigate} notifications={false} actions={headerActions} {...menu} />
      )}
      overlay={<CommandPalette navigate={navigate} admin />}
    >
      {children}
    </AppFrame>
  );
}

// === Command palette (⌘K) ===
// The search field in every sidebar promises this. Without it, ⌘K is a dead label.
