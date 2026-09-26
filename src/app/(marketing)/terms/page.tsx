import type { Metadata } from 'next';
import { TermsPage } from '@/features/public/legal';

export const metadata: Metadata = { title: 'Termos de uso · Stoqmate' };

export default function Page() {
  return <TermsPage />;
}
