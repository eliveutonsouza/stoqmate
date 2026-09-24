"use client";

import dynamic from 'next/dynamic';
import { AppFrame } from '@/components/layout/app-frame';
import { StoreSidebar } from '@/components/layout/store-sidebar';
import { AppHeader } from '@/components/layout/app-header';
import { MOCK } from '@/lib/mock';

const CommandPalette = dynamic(
  () => import('@/components/ui/command-palette').then(m => m.CommandPalette),
  { ssr: false }
);

export function StoreShell({ breadcrumb, navigate, headerActions, children }) {
  return (
    <AppFrame
      sidebar={<StoreSidebar navigate={navigate} />}
      renderHeader={(menu) => (
        <AppHeader breadcrumb={[MOCK.store.name, ...breadcrumb]} navigate={navigate} contextSwitch="store" actions={headerActions} {...menu} />
      )}
      overlay={<CommandPalette navigate={navigate} />}
    >
      {children}
    </AppFrame>
  );
}
