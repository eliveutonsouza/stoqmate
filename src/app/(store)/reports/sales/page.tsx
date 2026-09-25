import { SalesReport } from '@/features/reports/sales-report';
import { loadReportStores, loadSalesReport, reportFiltersFromParams } from '@/features/reports/queries';

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const filters = reportFiltersFromParams(await searchParams);
  const [report, stores] = await Promise.all([loadSalesReport(filters), loadReportStores()]);
  return <SalesReport report={report} filters={filters} stores={stores} />;
}
