import { ReportAttributes } from '@/features/reports/report-attributes';
import { loadCategoriesWithAttributes, loadAttributeReport } from '@/features/reports/queries';

export default async function Page({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { category } = await searchParams;
  const categories = await loadCategoriesWithAttributes();
  const categoryId = category || categories[0]?.id || '';
  const data = categoryId ? await loadAttributeReport(categoryId) : {};

  return <ReportAttributes categories={categories} categoryId={categoryId} data={data} />;
}
