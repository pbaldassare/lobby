import type { Venue } from '@lobby/shared';

export function pickVenue(
  venues: Venue[],
  venueParam: string | undefined,
): Venue | null {
  if (venues.length === 0) return null;
  if (venueParam) {
    const found = venues.find((v) => v.id === venueParam);
    if (found) return found;
  }
  return venues[0] ?? null;
}
