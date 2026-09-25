import { ReportCategories } from '@/features/reports/report-categories';
import { loadReportStores, loadSalesReport, reportFiltersFromParams } from '@/features/reports/queries';

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const filters = reportFiltersFromParams(await searchParams);
  const [report, stores] = await Promise.all([loadSalesReport(filters), loadReportStores()]);
  return <ReportCategories report={report} filters={filters} stores={stores} />;
}
