import { SupplierForm } from '@/features/entities/supplier-form';
import { loadSupplierFormData } from '@/features/operations/queries';

export default async function Page() {
  const { categories } = await loadSupplierFormData();
  return <SupplierForm categories={categories} />;
}
