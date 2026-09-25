"use client";

import { useQueryUpdate } from "@/hooks/use-query-update";
import { DEFAULT_REPORT_PERIOD, type ReportPeriod, type ReportRange } from "@/lib/report-range";

type Filters = { range: ReportRange; storeId: string | null };
type Store = { id: string; name: string };

// Liga o ReportHeader à URL: período e loja viram searchParams, o
// page.tsx relê e a RPC roda com o filtro novo.
export function useReportHeader(filters: Filters, stores: Store[]) {
  const { update, pending } = useQueryUpdate();

  const onRangeChange = ({ period, from, to }: { period: ReportPeriod; from?: string; to?: string }) => {
    update({
      period: period === DEFAULT_REPORT_PERIOD ? null : period,
      from: period === "custom" ? from : null,
      to: period === "custom" ? to : null,
    });
  };

  const storeName = filters.storeId ? stores.find((s) => s.id === filters.storeId)?.name ?? "loja" : null;

  return {
    headerProps: {
      range: filters.range,
      onRangeChange,
      stores,
      storeId: filters.storeId,
      onStoreChange: (id: string | null) => update({ store: id }),
      pending,
    },
    pending,
    // "19 ago – 18 set · Loja Centro" / "… · toda a rede" — pra subtítulo e nome do CSV.
    scopeLabel: `${filters.range.label} · ${storeName ?? "toda a rede"}`,
    fileSuffix: `${filters.range.from}_${filters.range.to}`,
  };
}
