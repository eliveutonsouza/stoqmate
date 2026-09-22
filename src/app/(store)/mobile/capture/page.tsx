import { MobileCapture } from '@/features/ai-flows/mobile-capture';
import { loadProductFormData } from '@/features/products/queries';

export default async function Page() {
  const { categories } = await loadProductFormData();
  return <MobileCapture categories={categories} />;
}
