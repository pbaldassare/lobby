'use server';

import { revalidatePath } from 'next/cache';
import type { Block, Report, ReportStatus } from '@lobby/shared';
import { requireVenueStaff, StaffAuthError } from '@/lib/auth/staff';
import { createAdminClient } from '@/lib/supabase/admin';

export type ModerationListResult =
  | { ok: true; blocks: Block[]; reports: Report[] }
  | { ok: false; error: string; blocks: Block[]; reports: Report[] };

export type ModerationActionResult =
  | { ok: true }
  | { ok: false; error: string };

export async function listVenueModeration(
  venueId: string,
): Promise<ModerationListResult> {
  try {
    await requireVenueStaff(venueId);
    const admin = createAdminClient();

    const { data: memberships } = await admin
      .from('memberships')
      .select('profile_id')
      .eq('venue_id', venueId);
    const profileIds =
      memberships?.map((m) => m.profile_id as string).filter(Boolean) ?? [];

    let blocks: Block[] = [];
    if (profileIds.length > 0) {
      const list = profileIds.join(',');
      const { data } = await admin
        .from('blocks')
        .select('*')
        .or(`blocker_id.in.(${list}),blocked_profile_id.in.(${list})`)
        .order('created_at', { ascending: false })
        .limit(100);
      blocks = (data ?? []) as Block[];
    }

    let reports: Report[] = [];
    try {
      const { data, error } = await admin
        .from('reports')
        .select('*')
        .eq('venue_id', venueId)
        .order('created_at', { ascending: false })
        .limit(100);
      if (!error && data) reports = data as Report[];
    } catch {
      reports = [];
    }

    return { ok: true, blocks, reports };
  } catch (err) {
    if (err instanceof StaffAuthError) {
      return { ok: false, error: err.message, blocks: [], reports: [] };
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Moderation load failed',
      blocks: [],
      reports: [],
    };
  }
}

export async function resolveReportAction(input: {
  venue_id: string;
  report_id: string;
  status: Extract<ReportStatus, 'resolved' | 'dismissed'>;
}): Promise<ModerationActionResult> {
  try {
    const staff = await requireVenueStaff(input.venue_id);
    const admin = createAdminClient();
    const { error } = await admin
      .from('reports')
      .update({
        status: input.status,
        resolved_at: new Date().toISOString(),
        resolved_by: staff.userId,
      })
      .eq('id', input.report_id)
      .eq('venue_id', input.venue_id);

    if (error) {
      return {
        ok: false,
        error:
          error.message.includes('does not exist') || error.code === '42P01'
            ? 'Reports table not available yet (backend pending)'
            : error.message,
      };
    }
    revalidatePath('/moderation');
    return { ok: true };
  } catch (err) {
    if (err instanceof StaffAuthError) return { ok: false, error: err.message };
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Resolve failed',
    };
  }
}

export async function removeBlockAction(input: {
  venue_id: string;
  block_id: string;
}): Promise<ModerationActionResult> {
  try {
    await requireVenueStaff(input.venue_id);
    const admin = createAdminClient();
    const { error } = await admin.from('blocks').delete().eq('id', input.block_id);
    if (error) return { ok: false, error: error.message };
    revalidatePath('/moderation');
    return { ok: true };
  } catch (err) {
    if (err instanceof StaffAuthError) return { ok: false, error: err.message };
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Remove block failed',
    };
  }
}
