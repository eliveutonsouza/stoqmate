import { Categories } from '@/features/products/categories';
import { loadCategoriesScreen } from '@/features/products/queries';

export default async function Page() {
  const categories = await loadCategoriesScreen();
  return <Categories initialCategories={categories} />;
}
