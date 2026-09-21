'use client';

import { useState, useTransition } from 'react';
import { BrandMark } from '@/components/BrandMark';
import { generateEventPreviewAction } from '@/lib/actions/promo';
import { editorialCopy } from '@/lib/promo/copy';
import type { PromoCopy, PromoFacts } from '@/lib/promo/types';

type Props = {
  facts: PromoFacts;
  initialCopy: PromoCopy | null;
};

export function EventPreview({ facts, initialCopy }: Props): React.JSX.Element {
  const [copy, setCopy] = useState<PromoCopy>(initialCopy ?? editorialCopy(facts));
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const generated = Boolean(copy.model && copy.model !== 'editorial');

  const generate = () => {
    start(async () => {
      setError(null);
      const result = await generateEventPreviewAction(facts);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setCopy(result.copy);
    });
  };

  return (
    <section className="event-preview" aria-label="Anteprima evento">
      <div className="event-preview-card">
        <BrandMark compact />
        <p className="kicker">App Lobby · {facts.city}</p>
        <h2>{copy.headline}</h2>
        <p className="event-lede">{copy.lede}</p>

        <dl className="event-facts">
          <div>
            <dt>Locale</dt>
            <dd>{facts.venueName}</dd>
          </div>
          <div>
            <dt>Stanza</dt>
            <dd>{facts.roomName}</dd>
          </div>
          <div>
            <dt>Città</dt>
            <dd>{facts.city}</dd>
          </div>
          <div>
            <dt>Orari</dt>
            <dd>{copy.schedule_line}</dd>
          </div>
        </dl>

        {typeof facts.cityLat === 'number' && typeof facts.cityLng === 'number' ? (
          <img
            className="city-map"
            alt={`Mappa di ${facts.city}`}
            src={`/api/places/static-map?lat=${facts.cityLat}&lng=${facts.cityLng}`}
          />
        ) : null}

        <div className="event-block">
          <h3>Cos’è Lobby</h3>
          <p>{copy.about_lobby}</p>
        </div>
        <div className="event-block">
          <h3>A cosa serve</h3>
          <p>{copy.purpose}</p>
        </div>
        <div className="event-block">
          <h3>Come si entra</h3>
          <p>{copy.how_to_enter}</p>
        </div>
        <div className="event-block">
          <h3>Privacy</h3>
          <p>{copy.privacy_note}</p>
        </div>

        <p className="event-cta">{copy.cta}</p>
        <p className="muted" style={{ margin: 0 }}>
          {generated
            ? 'Testo scritto con l’IA sui dati di questa stanza.'
            : 'Struttura pronta. Genera il testo promozionale con l’IA.'}
        </p>
      </div>

      {error ? <div className="error">{error}</div> : null}

      <div className="row-actions event-preview-actions">
        <button className="btn btn-gold" type="button" disabled={pending} onClick={generate}>
          {pending ? 'Scrivo…' : generated ? 'Rigenera con l’IA' : 'Crea anteprima con l’IA'}
        </button>
        <button className="btn btn-ghost" type="button" onClick={() => window.print()}>
          Stampa / schermo ingresso
        </button>
      </div>
    </section>
  );
}
