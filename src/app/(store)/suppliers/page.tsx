import { Suppliers } from '@/features/operations/suppliers';
import { loadSuppliersList } from '@/features/operations/suppliers-queries';

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const data = await loadSuppliersList(await searchParams);
  return <Suppliers {...data} />;
}
