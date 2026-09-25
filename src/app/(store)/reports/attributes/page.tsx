import { ReportAttributes } from '@/features/reports/report-attributes';
import { loadAttributeReportPage } from '@/features/reports/queries';

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { filters, stores, categories, categoryId, data } = await loadAttributeReportPage(await searchParams);
  return <ReportAttributes categories={categories} categoryId={categoryId} data={data} filters={filters} stores={stores} />;
}
