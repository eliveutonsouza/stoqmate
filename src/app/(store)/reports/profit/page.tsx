import { ReportProfit } from '@/features/reports/report-profit';
import { loadMonthlyProfit, loadReportStores, loadSalesReport, reportFiltersFromParams } from '@/features/reports/queries';

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const filters = reportFiltersFromParams(await searchParams);
  const [report, monthly, stores] = await Promise.all([
    loadSalesReport(filters), loadMonthlyProfit(filters.storeId), loadReportStores(),
  ]);
  return <ReportProfit report={report} monthly={monthly} filters={filters} stores={stores} />;
}
