import { googleMapsCityUrl } from '@/lib/maps/places';

type Props = {
  city: string;
  placeId?: string | null;
  lat?: number | null;
  lng?: number | null;
  showMap?: boolean;
};

export function CityLink({
  city,
  placeId,
  lat,
  lng,
  showMap = false,
}: Props): React.JSX.Element {
  const href = googleMapsCityUrl(city, placeId, lat, lng);
  const linked = Boolean(placeId) || (typeof lat === 'number' && typeof lng === 'number');

  return (
    <span className="city-link">
      <a href={href} target="_blank" rel="noreferrer">
        {city}
      </a>
      {linked ? (
        <span className="muted"> · Maps</span>
      ) : (
        <span className="muted"> · da collegare</span>
      )}
      {showMap && typeof lat === 'number' && typeof lng === 'number' ? (
        <img
          className="city-map"
          alt={`Mappa di ${city}`}
          src={`/api/places/static-map?lat=${lat}&lng=${lng}`}
        />
      ) : null}
    </span>
  );
}
