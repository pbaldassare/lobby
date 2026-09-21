/** Google Places / Geocoding — solo server. La chiave non va nel client. */

export type CitySuggestion = {
  placeId: string;
  city: string;
  description: string;
};

export type ResolvedCity = {
  city: string;
  placeId: string;
  lat: number;
  lng: number;
  description: string;
};

type AutocompletePrediction = {
  place_id?: string;
  description?: string;
  structured_formatting?: { main_text?: string };
};

type AutocompleteResponse = {
  status?: string;
  error_message?: string;
  predictions?: AutocompletePrediction[];
};

type PlaceDetailsResponse = {
  status?: string;
  error_message?: string;
  result?: {
    name?: string;
    formatted_address?: string;
    place_id?: string;
    geometry?: { location?: { lat?: number; lng?: number } };
    address_components?: Array<{ long_name?: string; types?: string[] }>;
  };
};

type GeocodeResponse = {
  status?: string;
  error_message?: string;
  results?: Array<{
    place_id?: string;
    formatted_address?: string;
    geometry?: { location?: { lat?: number; lng?: number } };
    address_components?: Array<{ long_name?: string; types?: string[] }>;
  }>;
};

export function getGoogleMapsKey(): string {
  const key = process.env.GOOGLE_MAPS_API_KEY?.trim();
  if (!key) {
    throw new Error(
      'Manca GOOGLE_MAPS_API_KEY (solo server). Impostala in .env.local o nei secret.',
    );
  }
  return key;
}

function cityFromComponents(
  components: Array<{ long_name?: string; types?: string[] }> | undefined,
  fallback: string,
): string {
  if (!components) return fallback;
  const locality = components.find((c) => c.types?.includes('locality'));
  if (locality?.long_name) return locality.long_name;
  const admin = components.find((c) =>
    c.types?.includes('administrative_area_level_3'),
  );
  if (admin?.long_name) return admin.long_name;
  return fallback;
}

export async function suggestCities(query: string): Promise<CitySuggestion[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const url = new URL('https://maps.googleapis.com/maps/api/place/autocomplete/json');
  url.searchParams.set('input', q);
  url.searchParams.set('types', '(cities)');
  url.searchParams.set('language', 'it');
  url.searchParams.set('key', getGoogleMapsKey());

  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error('Google Maps non risponde.');
  }
  const data = (await res.json()) as AutocompleteResponse;
  if (data.status === 'ZERO_RESULTS') return [];
  if (data.status !== 'OK') {
    throw new Error(data.error_message ?? 'Ricerca città non riuscita.');
  }
  return (data.predictions ?? [])
    .filter((p): p is AutocompletePrediction & { place_id: string } =>
      Boolean(p.place_id),
    )
    .map((p) => ({
      placeId: p.place_id,
      city: p.structured_formatting?.main_text?.trim() || p.description || q,
      description: p.description ?? p.structured_formatting?.main_text ?? q,
    }));
}

export async function resolvePlaceId(placeId: string): Promise<ResolvedCity | null> {
  const id = placeId.trim();
  if (!id) return null;
  const url = new URL('https://maps.googleapis.com/maps/api/place/details/json');
  url.searchParams.set('place_id', id);
  url.searchParams.set('fields', 'place_id,name,formatted_address,geometry,address_component');
  url.searchParams.set('language', 'it');
  url.searchParams.set('key', getGoogleMapsKey());

  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error('Google Maps non risponde.');
  }
  const data = (await res.json()) as PlaceDetailsResponse;
  if (data.status !== 'OK' || !data.result) return null;
  const lat = data.result.geometry?.location?.lat;
  const lng = data.result.geometry?.location?.lng;
  if (typeof lat !== 'number' || typeof lng !== 'number') return null;
  const city = cityFromComponents(
    data.result.address_components,
    data.result.name ?? '',
  );
  if (!city) return null;
  return {
    city,
    placeId: data.result.place_id ?? id,
    lat,
    lng,
    description: data.result.formatted_address ?? city,
  };
}

export async function geocodeCity(query: string): Promise<ResolvedCity | null> {
  const q = query.trim();
  if (!q) return null;
  const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
  url.searchParams.set('address', q);
  url.searchParams.set('language', 'it');
  url.searchParams.set('key', getGoogleMapsKey());

  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error('Google Maps non risponde.');
  }
  const data = (await res.json()) as GeocodeResponse;
  if (data.status === 'ZERO_RESULTS') return null;
  if (data.status !== 'OK') {
    throw new Error(data.error_message ?? 'Città non trovata su Google Maps.');
  }
  const first = data.results?.[0];
  const lat = first?.geometry?.location?.lat;
  const lng = first?.geometry?.location?.lng;
  const placeId = first?.place_id;
  if (!first || typeof lat !== 'number' || typeof lng !== 'number' || !placeId) {
    return null;
  }
  const city = cityFromComponents(first.address_components, q);
  return {
    city,
    placeId,
    lat,
    lng,
    description: first.formatted_address ?? city,
  };
}

export function googleMapsCityUrl(
  city: string,
  placeId?: string | null,
  lat?: number | null,
  lng?: number | null,
): string {
  if (placeId) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(city)}&query_place_id=${encodeURIComponent(placeId)}`;
  }
  if (typeof lat === 'number' && typeof lng === 'number') {
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(city)}`;
}

export async function fetchStaticMapPng(lat: number, lng: number): Promise<ArrayBuffer> {
  const url = new URL('https://maps.googleapis.com/maps/api/staticmap');
  url.searchParams.set('center', `${lat},${lng}`);
  url.searchParams.set('zoom', '11');
  url.searchParams.set('size', '400x140');
  url.searchParams.set('scale', '2');
  url.searchParams.set('maptype', 'roadmap');
  url.searchParams.set('markers', `color:0x8A6D1F|${lat},${lng}`);
  url.searchParams.set('key', getGoogleMapsKey());
  const res = await fetch(url, { cache: 'force-cache' });
  if (!res.ok) {
    throw new Error('Mappa non disponibile.');
  }
  return res.arrayBuffer();
}
