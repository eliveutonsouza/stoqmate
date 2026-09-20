import { ReportProfit } from '@/features/reports/report-profit';
import { loadSalesReport, loadMonthlyProfit } from '@/features/reports/queries';

export default async function Page() {
  const [report, monthly] = await Promise.all([loadSalesReport(), loadMonthlyProfit()]);
  return <ReportProfit report={report} monthly={monthly} />;
}
