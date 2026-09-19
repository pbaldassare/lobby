export type LinkedInProjectDraft = {
  title: string;
  role_title: string | null;
  public_pitch: string;
};

const SECTION =
  /^(experience|esperienza|projects?|progetti|featured|in evidenza|about|informazioni)$/i;
const DATE_LINE =
  /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|gen|mag|giu|lug|ago|set|ott|dic)\b|\d{4}\s*[–\-—]\s*(\d{4}|presente?|oggi|attuale|current)|^\d{1,2}\s+(mesi|anni|months?|years?)\b/i;
const META_LINE = /^(full-time|part-time|tempo pieno|tempo parziale|remote|ibrido|hybrid|onsite)/i;

function isSkippable(line: string): boolean {
  return SECTION.test(line) || DATE_LINE.test(line) || META_LINE.test(line);
}

function splitRoleAndTitle(first: string): { title: string; role: string | null } {
  const at = first.match(/^(.+?)\s+(?:at|presso|@)\s+(.+)$/i);
  if (at?.[1] && at[2]) return { role: at[1].trim(), title: at[2].trim() };
  const mid = first.match(/^(.+?)\s*[·|•—–-]\s*(.+)$/);
  if (mid?.[1] && mid[2] && mid[1].length < 80 && mid[2].length < 120) {
    return { role: mid[1].trim(), title: mid[2].trim() };
  }
  return { title: first.trim(), role: null };
}

/**
 * Trasforma un incolla da LinkedIn (Esperienza / Progetti) in bozze Lobby.
 * Non chiama LinkedIn: è una copia nel nostro DB.
 */
export function parseLinkedInProjects(raw: string): LinkedInProjectDraft[] {
  const text = raw.replace(/\r\n/g, '\n').trim();
  if (!text) return [];

  const blocks = text
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean);

  const seen = new Set<string>();
  const out: LinkedInProjectDraft[] = [];

  for (const block of blocks) {
    const lines = block
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !isSkippable(l));
    if (lines.length === 0) continue;

    const first = lines[0];
    if (!first) continue;
    const { title, role } = splitRoleAndTitle(first);
    const key = title.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    out.push({
      title: title.slice(0, 160),
      role_title: role ? role.slice(0, 80) : null,
      public_pitch: lines.slice(1).join(' ').slice(0, 800),
    });
  }

  return out;
}
