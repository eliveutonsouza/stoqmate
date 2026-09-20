import { ReportCategories } from '@/features/reports/report-categories';
import { loadSalesReport } from '@/features/reports/queries';

export default async function Page() {
  const report = await loadSalesReport();
  return <ReportCategories report={report} />;
}
