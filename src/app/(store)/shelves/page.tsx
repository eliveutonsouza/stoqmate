import { Shelves } from '@/features/operations/shelves';
import { loadShelvesScreen } from '@/features/operations/queries';

export default async function Page() {
  const { locations, products, stores } = await loadShelvesScreen();
  return <Shelves initialLocations={locations} products={products} stores={stores} />;
}
