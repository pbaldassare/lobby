import { redirect } from 'next/navigation';

type Props = { searchParams: Promise<{ venue?: string }> };

export default async function LegacyVerifyPage({ searchParams }: Props) {
  const params = await searchParams;
  const q = params.venue ? `?venue=${encodeURIComponent(params.venue)}` : '';
  redirect(`/registrati${q}`);
}
