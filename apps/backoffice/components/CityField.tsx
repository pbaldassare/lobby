'use client';

import { useEffect, useId, useRef, useState } from 'react';
import type { CitySuggestion, ResolvedCity } from '@/lib/maps/places';

type Props = {
  id?: string;
  required?: boolean;
};

export function CityField({ id, required = true }: Props): React.JSX.Element {
  const autoId = useId();
  const inputId = id ?? `city-${autoId}`;
  const listId = `${inputId}-list`;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<CitySuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<ResolvedCity | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const search = (value: string) => {
    if (timer.current) clearTimeout(timer.current);
    if (value.trim().length < 2) {
      setSuggestions([]);
      setOpen(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    timer.current = setTimeout(() => {
      void (async () => {
        try {
          const res = await fetch(
            `/api/places/cities?q=${encodeURIComponent(value.trim())}`,
          );
          const data = (await res.json()) as {
            suggestions?: CitySuggestion[];
            error?: string;
          };
          if (!res.ok) {
            setError(data.error ?? 'Ricerca città non riuscita.');
            setSuggestions([]);
            setOpen(false);
            return;
          }
          setError(null);
          setSuggestions(data.suggestions ?? []);
          setOpen((data.suggestions ?? []).length > 0);
        } catch {
          setError('Google Maps non risponde.');
          setSuggestions([]);
          setOpen(false);
        } finally {
          setLoading(false);
        }
      })();
    }, 280);
  };

  const pick = async (suggestion: CitySuggestion) => {
    setQuery(suggestion.city);
    setOpen(false);
    setSuggestions([]);
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/places/cities?placeId=${encodeURIComponent(suggestion.placeId)}`,
      );
      const data = (await res.json()) as { city?: ResolvedCity; error?: string };
      if (!res.ok || !data.city) {
        setError(data.error ?? 'Città non collegata.');
        setSelected(null);
        return;
      }
      setSelected(data.city);
      setQuery(data.city.city);
    } catch {
      setError('Google Maps non risponde.');
      setSelected(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="field city-field">
      <label htmlFor={inputId}>Città</label>
      <input
        id={inputId}
        name="city"
        autoComplete="off"
        required={required}
        value={query}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        placeholder="Cerca su Google Maps…"
        onChange={(e) => {
          const value = e.target.value;
          setQuery(value);
          setSelected(null);
          setError(null);
          search(value);
        }}
        onFocus={() => {
          if (suggestions.length > 0) setOpen(true);
        }}
        onBlur={() => {
          setTimeout(() => setOpen(false), 120);
        }}
      />
      <input type="hidden" name="city_place_id" value={selected?.placeId ?? ''} />
      <input
        type="hidden"
        name="city_lat"
        value={selected?.lat != null ? String(selected.lat) : ''}
      />
      <input
        type="hidden"
        name="city_lng"
        value={selected?.lng != null ? String(selected.lng) : ''}
      />
      {open ? (
        <ul id={listId} className="city-suggest" role="listbox">
          {suggestions.map((item) => (
            <li key={item.placeId} role="option">
              <button type="button" onMouseDown={() => void pick(item)}>
                <strong>{item.city}</strong>
                <span>{item.description}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {loading ? <p className="muted">Cerco su Google Maps…</p> : null}
      {error ? <div className="error">{error}</div> : null}
      {selected ? (
        <div className="city-picked">
          <p className="muted" style={{ margin: 0 }}>
            Collegata a Google Maps · {selected.description}
          </p>
          <img
            className="city-map"
            alt={`Mappa di ${selected.city}`}
            src={`/api/places/static-map?lat=${selected.lat}&lng=${selected.lng}`}
          />
        </div>
      ) : (
        <p className="muted">Scegli una città dai suggerimenti di Google Maps.</p>
      )}
    </div>
  );
}
