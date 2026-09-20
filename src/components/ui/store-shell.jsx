"use client";

import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import { layoutStyles } from '@/components/layout/layout-styles';
import { StoreSidebar } from '@/components/layout/store-sidebar';
import { AppHeader } from '@/components/layout/app-header';
import { MOCK } from '@/lib/mock';

const CommandPalette = dynamic(
  () => import('@/components/ui/command-palette').then(m => m.CommandPalette),
  { ssr: false }
);

export function StoreShell({ breadcrumb, navigate, headerActions, children }) {
  const pathname = usePathname();
  return (
    <div style={layoutStyles.appShell}>
      <StoreSidebar route={pathname} navigate={navigate} />
      <div style={layoutStyles.main}>
        <AppHeader breadcrumb={[MOCK.store.name, ...breadcrumb]} navigate={navigate} contextSwitch="store" actions={headerActions} />
        <div style={layoutStyles.content} data-content-area>{children}</div>
      </div>
      <CommandPalette navigate={navigate} />
    </div>
  );
}
