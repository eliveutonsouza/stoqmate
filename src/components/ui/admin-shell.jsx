"use client";

import { usePathname } from 'next/navigation';
import { layoutStyles } from '@/components/layout/layout-styles';
import { AdminSidebar } from '@/components/layout/admin-sidebar';
import { AppHeader } from '@/components/layout/app-header';
import { CommandPalette } from '@/components/ui/command-palette';

export function AdminShell({ breadcrumb, navigate, headerActions, children }) {
  const pathname = usePathname();
  return (
    <div style={layoutStyles.appShell}>
      <AdminSidebar route={pathname} navigate={navigate} />
      <div style={layoutStyles.main}>
        <AppHeader breadcrumb={['Console', ...breadcrumb]} navigate={navigate} contextSwitch="admin" actions={headerActions} />
        <div style={layoutStyles.content} data-content-area>{children}</div>
      </div>
      <CommandPalette navigate={navigate} admin />
    </div>
  );
}

// === Command palette (⌘K) ===
// The search field in every sidebar promises this. Without it, ⌘K is a dead label.
