import { ShelfForm } from '@/features/entities/shelf-form';
import { loadLocationFormData } from '@/features/operations/queries';

export default async function Page() {
  const { categories, stores } = await loadLocationFormData();
  return <ShelfForm categories={categories} stores={stores} />;
}
