import { ProductsList } from '@/features/products/products-list';
import { loadProductsList } from '@/features/products/queries';

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const data = await loadProductsList(await searchParams);
  return <ProductsList {...data} />;
}
