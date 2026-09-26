import { ProductDetail } from '@/features/product-detail/product-detail';
import { ProductNotFound } from '@/features/product-detail/product-not-found';
import { loadProductDetailScreen } from '@/features/products/queries';

export default async function Page({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams;
  const detail = id ? await loadProductDetailScreen(id) : null;
  return detail ? <ProductDetail detail={detail} /> : <ProductNotFound />;
}
