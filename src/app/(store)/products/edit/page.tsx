import { ProductForm } from '@/features/product-detail/product-form';
import { ProductNotFound } from '@/features/product-detail/product-not-found';
import { loadProductFormData, loadProduct } from '@/features/products/queries';

export default async function Page({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams;
  const [{ categories, suppliers, locations }, product] = await Promise.all([
    loadProductFormData(),
    id ? loadProduct(id) : Promise.resolve(null),
  ]);
  if (id && !product) return <ProductNotFound />;
  return <ProductForm categories={categories} suppliers={suppliers} locations={locations} product={product} />;
}
