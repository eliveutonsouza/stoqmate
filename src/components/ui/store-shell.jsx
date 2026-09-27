"use client";

import dynamic from 'next/dynamic';
import { AppFrame } from '@/components/layout/app-frame';
import { StoreSidebar } from '@/components/layout/store-sidebar';
import { AppHeader } from '@/components/layout/app-header';
import { useShell } from '@/components/layout/shell-context';
import { useCan } from '@/hooks/use-can';

const CommandPalette = dynamic(
  () => import('@/components/ui/command-palette').then(m => m.CommandPalette),
  { ssr: false }
);

export function StoreShell({ breadcrumb, navigate, headerActions, children }) {
  const shell = useShell();
  const root = shell?.tenant?.name;
  const canGo = useCan();
  return (
    <AppFrame
      sidebar={<StoreSidebar navigate={navigate} />}
      renderHeader={(menu) => (
        <AppHeader breadcrumb={root ? [root, ...breadcrumb] : breadcrumb} navigate={navigate} unread={shell?.counts?.unread_notifications ?? 0} actions={headerActions} {...menu} />
      )}
      overlay={<CommandPalette navigate={navigate} allowed={canGo} />}
    >
      {children}
    </AppFrame>
  );
}
