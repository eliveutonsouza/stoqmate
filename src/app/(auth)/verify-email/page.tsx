import { VerifyEmail } from '@/features/public/verify-email';

export default async function Page({ searchParams }: { searchParams: Promise<{ email?: string }> }) {
  const { email } = await searchParams;
  return <VerifyEmail email={email ?? ''} />;
}
