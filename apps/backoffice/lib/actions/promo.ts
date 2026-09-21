'use server';

import { revalidatePath } from 'next/cache';
import { StaffAuthError, requireVenueStaff } from '@/lib/auth/staff';
import { generatePromoCopy } from '@/lib/promo/generate';
import type { PromoCopy, PromoFacts } from '@/lib/promo/types';
import { saveRoomPromo } from '@/lib/data/promos';

export type PromoActionResult =
  | { ok: true; copy: PromoCopy }
  | { ok: false; error: string };

export async function generateEventPreviewAction(
  facts: PromoFacts,
): Promise<PromoActionResult> {
  try {
    await requireVenueStaff(facts.venueId);
    const copy = await generatePromoCopy(facts);
    const saved = await saveRoomPromo(facts.venueId, facts.roomId, copy);
    revalidatePath('/qr');
    return { ok: true, copy: saved };
  } catch (err) {
    if (err instanceof StaffAuthError) return { ok: false, error: err.message };
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Anteprima non generata.',
    };
  }
}
