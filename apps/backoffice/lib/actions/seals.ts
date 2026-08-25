'use server';

import { revalidatePath } from 'next/cache';
import {
  EDGE_FUNCTIONS,
  type IssueSealRequest,
  type IssueSealResponse,
  type Membership,
  type VerificationStatus,
} from '@lobby/shared';
import { requireVenueStaff, StaffAuthError } from '@/lib/auth/staff';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { getPublicSupabaseUrl } from '@/lib/env';

export type SealActionResult =
  | { ok: true; membership: Membership }
  | { ok: false; error: string };

/**
 * Privileged seal issuance.
 * 1) requireVenueStaff on every call
 * 2) Edge Function `issue-seal` (user JWT)
 * 3) Fallback RPC / direct update with service role
 */
export async function issueSealAction(
  input: IssueSealRequest,
): Promise<SealActionResult> {
  try {
    const staff = await requireVenueStaff(input.venue_id);
    const admin = createAdminClient();

    const { data: membership, error: memErr } = await admin
      .from('memberships')
      .select('*')
      .eq('id', input.membership_id)
      .eq('venue_id', input.venue_id)
      .maybeSingle();

    if (memErr || !membership) {
      return { ok: false, error: memErr?.message ?? 'Membership not found for venue' };
    }

    if ((membership as Membership).verified_status === 'revoked') {
      return { ok: false, error: 'Cannot seal a revoked membership' };
    }

    const viaEdge = await callIssueSealEdge(input.membership_id);
    if (viaEdge) {
      revalidatePath('/verify');
      revalidatePath('/dashboard');
      return viaEdge;
    }

    const { data: rpcMembership, error: rpcErr } = await admin.rpc('issue_seal', {
      p_membership_id: input.membership_id,
      p_issuer_id: staff.userId,
    });

    if (!rpcErr && rpcMembership) {
      revalidatePath('/verify');
      revalidatePath('/dashboard');
      return { ok: true, membership: rpcMembership as Membership };
    }

    const now = new Date().toISOString();
    const { data: updated, error: updErr } = await admin
      .from('memberships')
      .update({
        verified_status: 'verified' satisfies VerificationStatus,
        seal_issued_at: now,
        seal_issued_by: staff.userId,
      })
      .eq('id', input.membership_id)
      .eq('venue_id', input.venue_id)
      .select('*')
      .single();

    if (updErr || !updated) {
      return {
        ok: false,
        error:
          rpcErr?.message ??
          updErr?.message ??
          'Failed to issue seal',
      };
    }

    revalidatePath('/verify');
    revalidatePath('/dashboard');
    return { ok: true, membership: updated as Membership };
  } catch (err) {
    if (err instanceof StaffAuthError) return { ok: false, error: err.message };
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Unexpected seal error',
    };
  }
}

export async function rejectMembershipAction(input: {
  membership_id: string;
  venue_id: string;
}): Promise<SealActionResult> {
  try {
    await requireVenueStaff(input.venue_id);
    const admin = createAdminClient();
    const { data: updated, error } = await admin
      .from('memberships')
      .update({
        verified_status: 'rejected' satisfies VerificationStatus,
        seal_issued_at: null,
        seal_issued_by: null,
      })
      .eq('id', input.membership_id)
      .eq('venue_id', input.venue_id)
      .select('*')
      .single();

    if (error || !updated) {
      return { ok: false, error: error?.message ?? 'Reject failed' };
    }
    revalidatePath('/verify');
    revalidatePath('/dashboard');
    return { ok: true, membership: updated as Membership };
  } catch (err) {
    if (err instanceof StaffAuthError) return { ok: false, error: err.message };
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Unexpected error',
    };
  }
}

async function callIssueSealEdge(
  membershipId: string,
): Promise<SealActionResult | null> {
  try {
    const url = `${getPublicSupabaseUrl()}/functions/v1/${EDGE_FUNCTIONS.issueSeal}`;
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      return { ok: false, error: 'Missing session for issue-seal' };
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ membership_id: membershipId }),
    });

    if (res.status === 404 || res.status === 503) return null;

    const body = (await res.json()) as
      | IssueSealResponse
      | { membership?: Membership; error?: string };

    if (!res.ok) {
      return {
        ok: false,
        error:
          typeof body === 'object' && body && 'error' in body && typeof body.error === 'string'
            ? body.error
            : `issue-seal failed (${res.status})`,
      };
    }

    if ('ok' in body && body.ok === true) {
      return { ok: true, membership: body.membership };
    }
    if ('ok' in body && body.ok === false) {
      return { ok: false, error: body.error };
    }
    if ('membership' in body && body.membership) {
      return { ok: true, membership: body.membership };
    }
    return null;
  } catch {
    return null;
  }
}
