import type { PromoCopy, PromoFacts } from '@/lib/promo/types';

const ABOUT =
  'Lobby è il layer di networking per venue premium — club, lounge, hotel, coworking. Quando sei fisicamente in un locale, puoi apparire e vedere chi vale la pena incontrare.';

export function editorialCopy(facts: PromoFacts): PromoCopy {
  return {
    headline: `${facts.venueName} · ${facts.roomName}`,
    lede: `Apri Lobby in ${facts.city}. Entra in ${facts.roomName}: resta invisibile, appari solo se vuoi.`,
    about_lobby: ABOUT,
    purpose:
      'Serve a incontrare le persone giuste in questa stanza, non a essere visti da fuori. Il sigillo lo rilascia il locale. Una connessione nasce solo se entrambi acconsentono.',
    how_to_enter: `Inquadra il QR, apri l’app Lobby (${facts.memberAppUrl.replace(/^https?:\/\//, '')}) e entra in ${facts.roomName}. Stesso permesso se sei socio col sigillo.`,
    privacy_note:
      'Invisibile di default. Visibile solo in questa stanza, e solo se lo decidi tu. Quando esci, sparisci.',
    cta: 'Inquadra e apri Lobby',
    schedule_line: facts.schedule,
    model: 'editorial',
  };
}

export function promoSystemPrompt(): string {
  return [
    'Sei il copywriter di Lobby, app di networking per venue premium.',
    'Scrivi in italiano, tono editoriale, calmo, senza hype da discoteca e senza emoji.',
    'Rispetta SEMPRE le regole: invisibile di default; visibile solo nella stanza in cui sei; la visibilità si spegne all’uscita; connessione solo per consenso reciproco; il sigillo lo rilascia il venue, non l’utente.',
    'Non inventare ospiti, numeri, speaker o sponsor. Non promettere di vedere chi c’è prima di entrare e apparire.',
    'Lobby non è un social virtuale: funziona solo se sei fisicamente in quella stanza.',
    'Usa i fatti forniti: nome locale, stanza, città, orari, URL app.',
    'Rispondi SOLO con JSON: headline, lede, about_lobby, purpose, how_to_enter, privacy_note, cta.',
    'Lunghezze: headline ≤120, lede ≤280, about_lobby/purpose/how_to_enter ≤420, privacy_note ≤280, cta ≤80.',
  ].join(' ');
}

export function promoUserPrompt(facts: PromoFacts): string {
  return [
    `App: Lobby — ${facts.memberAppUrl}`,
    `Locale: ${facts.venueName}`,
    `Città: ${facts.city}`,
    `Stanza: ${facts.roomName}`,
    `Orari: ${facts.schedule}`,
    'Scrivi un’anteprima che promuove l’ingresso in questa stanza.',
    'about_lobby deve dire cos’è Lobby.',
    'purpose deve dire a cosa serve, in questo locale e in questa stanza.',
    'how_to_enter deve citare QR + app Lobby.',
    'privacy_note deve ripetere invisibile / solo in stanza / off all’uscita.',
  ].join('\n');
}

function clip(value: string, max: number, fallback: string): string {
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  return trimmed.length > max ? `${trimmed.slice(0, max - 1).trimEnd()}…` : trimmed;
}

export function sanitizeCopy(raw: Partial<PromoCopy>, facts: PromoFacts): PromoCopy {
  const base = editorialCopy(facts);
  return {
    headline: clip(raw.headline ?? '', 160, base.headline),
    lede: clip(raw.lede ?? '', 400, base.lede),
    about_lobby: clip(raw.about_lobby ?? '', 600, base.about_lobby),
    purpose: clip(raw.purpose ?? '', 600, base.purpose),
    how_to_enter: clip(raw.how_to_enter ?? '', 600, base.how_to_enter),
    privacy_note: clip(raw.privacy_note ?? '', 400, base.privacy_note),
    cta: clip(raw.cta ?? '', 120, base.cta),
    schedule_line: facts.schedule,
    model: raw.model ?? null,
  };
}
