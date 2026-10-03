import type { Profile } from '@lobby/shared/types';

export function initialsFromProfile(
  profile: Pick<Profile, 'display_name'> | null | undefined,
): string {
  const name = profile?.display_name?.trim();
  if (!name) return '?';
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return (parts[0]?.slice(0, 2) ?? '?').toUpperCase();
  const a = parts[0]?.[0] ?? '';
  const b = parts[parts.length - 1]?.[0] ?? '';
  return `${a}${b}`.toUpperCase() || '?';
}

export function scoreToPercent(score: number): number {
  if (score <= 1) return Math.round(score * 100);
  return Math.round(score);
}

export function suggestedOpener(reasons: string[], seek: string[]): string {
  const reason = reasons[0];
  if (reason) return `Ho visto cosa ci accomuna — ${reason}. Hai due minuti per un saluto?`;
  if (seek[0]) return `Ho visto che cerchi ${seek[0]}: forse posso darti una mano.`;
  return 'Piacere di incrociarti qui. Ti va di presentarci?';
}
