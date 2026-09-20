import { ReportABC } from '@/features/analysis/report-abc';
import { loadAbcReport } from '@/features/reports/queries';

export default async function Page() {
  const { range, rows } = await loadAbcReport();
  const periodDays = Math.max(1, Math.round((range.end.getTime() - range.start.getTime()) / 86400000));
  return <ReportABC rows={rows} periodDays={periodDays} />;
}
