import { ShelfForm } from '@/features/entities/shelf-form';
import { loadLocationFormData } from '@/features/operations/queries';

export default async function Page({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams;
  const { categories, stores, location, productCount } = await loadLocationFormData(id);
  return <ShelfForm mode="edit" categories={categories} stores={stores} location={location} productCount={productCount} />;
}
