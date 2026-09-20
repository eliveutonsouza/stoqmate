"use client";

import { PageHeader } from '@/components/layout/page-header';
import { I } from '@/components/icons';

export function ReportHeader({ title, sub }) {
  return (
    <PageHeader
      title={title} sub={sub}
      actions={(
        <>
          <button className="btn btn-outline btn-sm"><I.Filter size={13} /> 19 ago – 18 set <I.ChevronDown size={11} /></button>
          <button className="btn btn-outline btn-sm"><I.Store size={13} /> Toda a rede <I.ChevronDown size={11} /></button>
          <button className="btn btn-outline btn-sm"><I.Download size={13} /> Exportar Excel</button>
        </>
      )}
    />
  );
}

// === Categories & products ===
