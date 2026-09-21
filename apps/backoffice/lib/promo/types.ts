export type PromoFacts = {
  venueId: string;
  roomId: string;
  venueName: string;
  city: string;
  cityPlaceId: string | null;
  cityLat: number | null;
  cityLng: number | null;
  roomName: string;
  schedule: string;
  memberAppUrl: string;
};

export type PromoCopy = {
  headline: string;
  lede: string;
  about_lobby: string;
  purpose: string;
  how_to_enter: string;
  privacy_note: string;
  cta: string;
  schedule_line: string;
  model: string | null;
};
