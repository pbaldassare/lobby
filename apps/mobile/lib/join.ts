import { getWebOrigin } from './env';
import { router } from 'expo-router';

export type ParsedJoin = {
  kind: 'join';
  roomId: string;
  code: string | null;
  wifi: string | null;
  method: string | null;
};

export type ParsedMember = {
  kind: 'member';
  profileId: string;
};

export type ParsedScan = ParsedJoin | ParsedMember;

/**
 * QR / paste / HTTPS join URLs.
 * Native posters use `lobby://…`; the PWA uses the same path on https.
 */
export function parseScan(raw: string): ParsedScan | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const normalized = trimmed.includes('://')
      ? trimmed
      : trimmed.startsWith('join?') || trimmed.startsWith('invite-guest?')
        ? `lobby://${trimmed}`
        : trimmed;

    if (normalized.startsWith('lobby://room/')) {
      const roomId = normalized.replace('lobby://room/', '').split(/[?#]/)[0];
      return roomId ? { kind: 'join', roomId, code: null, wifi: null, method: null } : null;
    }
    if (normalized.startsWith('lobby://member/')) {
      const profileId = normalized.replace('lobby://member/', '').split(/[?#]/)[0];
      return profileId ? { kind: 'member', profileId } : null;
    }

    const url = new URL(normalized);
    const path = url.pathname.replace(/\/$/, '') || '/';

    const memberId =
      url.searchParams.get('profileId') ??
      (path.startsWith('/member/') ? path.slice('/member/'.length) : null);
    if (path.endsWith('/invite-guest') || path.endsWith('/member') || memberId) {
      if (memberId) return { kind: 'member', profileId: memberId };
    }

    const room = url.searchParams.get('room') ?? url.searchParams.get('roomId');
    if (room) {
      return {
        kind: 'join',
        roomId: room,
        code: url.searchParams.get('code'),
        wifi: url.searchParams.get('wifi'),
        method: url.searchParams.get('method'),
      };
    }
    return null;
  } catch {
    return null;
  }
}

export function memberCardUrl(profileId: string): string {
  const origin = getWebOrigin();
  if (origin) {
    return `${origin}/invite-guest?profileId=${encodeURIComponent(profileId)}`;
  }
  return `lobby://member/${profileId}`;
}

export type PendingDeepLink =
  | { href: '/(app)/join'; params: Record<string, string> }
  | { href: '/(app)/invite-guest'; params: { profileId: string } };

const PENDING_KEY = 'lobby.pendingDeepLink';

function webStore(): Storage | null {
  try {
    if (typeof sessionStorage === 'undefined') return null;
    return sessionStorage;
  } catch {
    return null;
  }
}

export function rememberDeepLink(link: PendingDeepLink): void {
  webStore()?.setItem(PENDING_KEY, JSON.stringify(link));
}

export function takePendingDeepLink(): PendingDeepLink | null {
  const storage = webStore();
  if (!storage) return null;
  const raw = storage.getItem(PENDING_KEY);
  if (!raw) return null;
  storage.removeItem(PENDING_KEY);
  try {
    return JSON.parse(raw) as PendingDeepLink;
  } catch {
    return null;
  }
}

export function consumePendingDeepLink(): boolean {
  const pending = takePendingDeepLink();
  if (!pending) return false;
  router.replace({ pathname: pending.href, params: pending.params });
  return true;
}

/** Capture `/join` and `/invite-guest` before auth redirects to welcome. */
export function captureWebEntry(): void {
  if (typeof window === 'undefined') return;
  const parsed = parseScan(window.location.href);
  if (!parsed) return;
  if (parsed.kind === 'join') {
    const params: Record<string, string> = { room: parsed.roomId };
    if (parsed.code) params.code = parsed.code;
    if (parsed.wifi) params.wifi = parsed.wifi;
    if (parsed.method) params.method = parsed.method;
    rememberDeepLink({ href: '/(app)/join', params });
    return;
  }
  rememberDeepLink({ href: '/(app)/invite-guest', params: { profileId: parsed.profileId } });
}

if (typeof window !== 'undefined') {
  captureWebEntry();
}
