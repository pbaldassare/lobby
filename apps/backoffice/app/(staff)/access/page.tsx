import { redirect } from 'next/navigation';

type Props = {
  searchParams: Promise<{ venue?: string; room?: string }>;
};

export default async function LegacyAccessPage({ searchParams }: Props) {
  const params = await searchParams;
  const q = new URLSearchParams();
  if (params.venue) q.set('venue', params.venue);
  if (params.room) q.set('room', params.room);
  const s = q.toString();
  redirect(s ? `/qr?${s}` : '/qr');
}
