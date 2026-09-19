'use server';

import type { VenueDashboardStats } from '@lobby/shared';
import { requireVenueStaff, StaffAuthError } from '@/lib/auth/staff';
import { tryCreateAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export type StatsResult =
  | { ok: true; stats: VenueDashboardStats }
  | { ok: false; error: string; stats: VenueDashboardStats };

function emptyStats(venueId: string): VenueDashboardStats {
  return {
    venue_id: venueId,
    active_presence: 0,
    visible_now: 0,
    pending_verifications: 0,
    verified_members: 0,
    seals_issued: 0,
    intros_total: 0,
    connections_total: 0,
    open_reports: 0,
  };
}

export async function getVenueDashboardStats(
  venueId: string,
): Promise<StatsResult> {
  try {
    await requireVenueStaff(venueId);
    const admin = tryCreateAdminClient() ?? (await createClient());

    const { data: rooms } = await admin
      .from('rooms')
      .select('id')
      .eq('venue_id', venueId);
    const roomIds = (rooms ?? []).map((r) => r.id as string);

    let active_presence = 0;
    let visible_now = 0;
    if (roomIds.length > 0) {
      const { data: presenceRows } = await admin
        .from('presence')
        .select('id, is_visible')
        .in('room_id', roomIds);
      active_presence = presenceRows?.length ?? 0;
      visible_now =
        presenceRows?.filter((p) => p.is_visible === true).length ?? 0;
    }

    const { data: memberships } = await admin
      .from('memberships')
      .select('profile_id, verified_status, seal_issued_at')
      .eq('venue_id', venueId);

    const pending_verifications =
      memberships?.filter((m) => m.verified_status === 'pending').length ?? 0;
    const verified_members =
      memberships?.filter((m) => m.verified_status === 'verified').length ?? 0;
    const seals_issued =
      memberships?.filter((m) => m.seal_issued_at != null).length ?? 0;

    const profileIds =
      memberships?.map((m) => m.profile_id as string).filter(Boolean) ?? [];

    let intros_total = 0;
    let connections_total = 0;
    if (profileIds.length > 0) {
      const list = profileIds.join(',');
      const { count: introCount } = await admin
        .from('intros')
        .select('id', { count: 'exact', head: true })
        .or(
          `profile_a_id.in.(${list}),profile_b_id.in.(${list}),introducer_id.in.(${list})`,
        );
      intros_total = introCount ?? 0;

      const { count: connCount } = await admin
        .from('signals')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'connected')
        .or(`from_profile_id.in.(${list}),to_profile_id.in.(${list})`);
      connections_total = connCount ?? 0;
    }

    let open_reports = 0;
    try {
      const { count } = await admin
        .from('reports')
        .select('id', { count: 'exact', head: true })
        .eq('venue_id', venueId)
        .in('status', ['open', 'reviewing']);
      open_reports = count ?? 0;
    } catch {
      open_reports = 0;
    }

    return {
      ok: true,
      stats: {
        venue_id: venueId,
        active_presence,
        visible_now,
        pending_verifications,
        verified_members,
        seals_issued,
        intros_total,
        connections_total,
        open_reports,
      },
    };
  } catch (err) {
    const stats = emptyStats(venueId);
    if (err instanceof StaffAuthError) {
      return { ok: false, error: err.message, stats };
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Statistiche non disponibili',
      stats,
    };
  }
}
