import { redirect } from 'next/navigation';

type Props = { searchParams: Promise<{ venue?: string }> };

export default async function LegacyDashboardPage({ searchParams }: Props) {
  const params = await searchParams;
  const q = params.venue ? `?venue=${encodeURIComponent(params.venue)}` : '';
  redirect(`/risultati${q}`);
}
