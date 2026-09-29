"use client";

import { AdminShell } from '@/components/ui/admin-shell';
import { useNavigate } from '@/hooks/use-navigate';
import { ContentSkeleton } from '@/features/shell/content-skeleton';

export function AdminRouteLoading() {
  const navigate = useNavigate();
  return (
    <AdminShell breadcrumb={[]} navigate={navigate}>
      <ContentSkeleton />
    </AdminShell>
  );
}
