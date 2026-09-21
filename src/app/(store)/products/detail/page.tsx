import { ProductDetail } from '@/features/product-detail/product-detail';
import { ProductNotFound } from '@/features/product-detail/product-not-found';
import { loadProductDetail, shapeProductDetailForStore } from '@/features/products/queries';
import { loadStores } from '@/features/stock/queries';

export default async function Page({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams;
  if (!id) return <ProductNotFound />;

  const [stores, rawDetail] = await Promise.all([loadStores(), loadProductDetail(id)]);
  if (!rawDetail) return <ProductNotFound />;

  const detail = shapeProductDetailForStore(rawDetail, stores[0]?.id ?? '');
  return <ProductDetail detail={detail} />;
}
