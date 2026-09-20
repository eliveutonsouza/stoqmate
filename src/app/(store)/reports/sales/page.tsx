import { SalesReport } from '@/features/reports/sales-report';
import { loadSalesReport } from '@/features/reports/queries';

export default async function Page() {
  const report = await loadSalesReport();
  return <SalesReport report={report} />;
}
