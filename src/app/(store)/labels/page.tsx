import { Labels } from '@/features/tools/labels';
import { loadLabelProducts } from '@/features/stock/screen-queries';

// ?products=id,id vem da seleção em lote do catálogo.
export default async function Page({ searchParams }: { searchParams: Promise<{ products?: string }> }) {
  const { products } = await searchParams;
  return <Labels initialProducts={await loadLabelProducts(products)} />;
}
