import { ReportsHub } from '@/features/reports/reports-hub';
import { loadSalesReport } from '@/features/reports/queries';

export default async function Page() {
  const report = await loadSalesReport();
  return <ReportsHub report={report} />;
}
