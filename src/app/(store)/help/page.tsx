import { HelpScreen } from '@/features/help/help-screen';

export default async function Page({ searchParams }: { searchParams: Promise<{ artigo?: string }> }) {
  const { artigo } = await searchParams;
  return <HelpScreen artigo={artigo} />;
}
