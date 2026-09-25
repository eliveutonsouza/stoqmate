import { ReportABC } from '@/features/analysis/report-abc';
import { loadAbcReport, loadReportStores, reportFiltersFromParams } from '@/features/reports/queries';

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const filters = reportFiltersFromParams(await searchParams);
  const [{ rows }, stores] = await Promise.all([loadAbcReport(filters), loadReportStores()]);
  return <ReportABC rows={rows} periodDays={filters.range.days} filters={filters} stores={stores} />;
}
