import type { Metadata } from 'next';
import { PrivacyPage } from '@/features/public/legal';

export const metadata: Metadata = { title: 'Política de privacidade · Stoqmate' };

export default function Page() {
  return <PrivacyPage />;
}
