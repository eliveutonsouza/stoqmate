import { ImportWizard } from '@/features/import/import-wizard';
import { loadImportScreen } from '@/features/products/queries';

export default async function Page() {
  const { stores, categories } = await loadImportScreen();
  return <ImportWizard stores={stores} categories={categories} />;
}
