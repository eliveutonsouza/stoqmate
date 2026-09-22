import { SupplierForm } from '@/features/entities/supplier-form';
import { loadSupplierFormData } from '@/features/operations/queries';

export default async function Page({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams;
  const { categories, supplier } = await loadSupplierFormData(id);
  return <SupplierForm mode="edit" categories={categories} supplier={supplier} />;
}
