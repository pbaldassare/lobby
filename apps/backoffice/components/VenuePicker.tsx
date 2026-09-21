'use client';

import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import type { Venue } from '@lobby/shared';

type Props = { venues: Venue[]; selectedId: string | null };

export function VenuePicker({ venues, selectedId }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (venues.length === 0) {
    return (
      <p className="muted">
        Nessun locale.{' '}
        <Link href="/istanze">Crea una stanza</Link> per partire.
      </p>
    );
  }

  return (
    <div className="field" style={{ maxWidth: 320, marginBottom: 20 }}>
      <label htmlFor="venue">Locale</label>
      <select
        id="venue"
        value={selectedId ?? ''}
        onChange={(e) => {
          const params = new URLSearchParams(searchParams.toString());
          params.set('venue', e.target.value);
          router.push(`${pathname}?${params.toString()}`);
        }}
      >
        {venues.map((v) => (
          <option key={v.id} value={v.id}>
            {v.name} · {v.city}
          </option>
        ))}
      </select>
    </div>
  );
}
