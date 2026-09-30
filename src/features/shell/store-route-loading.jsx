"use client";

import { StoreShell } from '@/components/ui/store-shell';
import { useNavigate } from '@/hooks/use-navigate';
import { ContentSkeleton } from '@/features/shell/content-skeleton';

export function StoreRouteLoading() {
  const navigate = useNavigate();
  return (
    <StoreShell breadcrumb={[]} navigate={navigate}>
      <ContentSkeleton />
    </StoreShell>
  );
}
