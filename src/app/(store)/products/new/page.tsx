import { ProductForm } from '@/features/product-detail/product-form';
import { loadProductFormData } from '@/features/products/queries';

export default async function Page({ searchParams }: { searchParams: Promise<{ location?: string }> }) {
  const [{ categories, suppliers, locations }, { location }] = await Promise.all([loadProductFormData(), searchParams]);
  // ?location= vem de "Cadastrar produto aqui" nos locais de estoque.
  const initialLocationId = locations.some((l) => l.id === location) ? location : '';
  return <ProductForm categories={categories} suppliers={suppliers} locations={locations} product={null} initialLocationId={initialLocationId} />;
}
