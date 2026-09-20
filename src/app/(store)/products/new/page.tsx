import { ProductForm } from '@/features/product-detail/product-form';
import { loadProductFormData } from '@/features/products/queries';

export default async function Page() {
  const { categories, suppliers, locations } = await loadProductFormData();
  return <ProductForm categories={categories} suppliers={suppliers} locations={locations} product={null} />;
}
