import { ProductDetail } from '@/features/product-detail/product-detail';
import { ProductNotFound } from '@/features/product-detail/product-not-found';
import { loadProductDetail } from '@/features/products/queries';
import { loadStores } from '@/features/stock/queries';

export default async function Page({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams;
  if (!id) return <ProductNotFound />;

  const stores = await loadStores();
  const detail = await loadProductDetail(id, stores[0]?.id ?? '');
  if (!detail) return <ProductNotFound />;

  return <ProductDetail detail={detail} />;
}
