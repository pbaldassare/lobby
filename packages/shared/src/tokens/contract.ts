/**
 * Contratto di tema — i RUOLI, non le tinte.
 *
 * I token storici (`colors.gold.base` e simili) nominano il colore: la stessa
 * tinta faceva da accento del marchio, kicker, tab attiva, metadati azienda e
 * spinner. Sei ruoli diversi che condividevano un hex per caso, quindi
 * impossibili da separare cambiando direzione visiva.
 *
 * Qui i punti d'uso citano il ruolo. Un tema nuovo è un file di dati.
 */

/** Stile di testo completo. Niente `fontWeight`: RN su Android non sintetizza
 *  i pesi per i font custom, quindi ogni voce nomina una faccia concreta. */
export type TypeStyle = {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  letterSpacing?: number;
  textTransform?: 'uppercase' | 'none';
};

export type ThemeColors = {
  bg: {
    /** Fondo della schermata. */
    canvas: string;
    /** Superficie sollevata: card, barre, fogli. */
    raised: string;
    /** Superficie incassata: campi di input, tracce degli interruttori. */
    sunken: string;
  };
  text: {
    primary: string;
    secondary: string;
    /** Testo di servizio: suggerimenti, stati vuoti, tab inattive. */
    tertiary: string;
    /** Testo sopra una superficie in tinta accento. */
    onAccent: string;
  };
  accent: {
    default: string;
    subtleBg: string;
    subtleBorder: string;
    /** Testo e icone sopra `accent.default`. */
    on: string;
  };
  /** Verde semantico: presenza live, punteggio match, connessione avvenuta.
   *  Non decorativo — se non significa una di queste cose, non si usa. */
  signal: {
    default: string;
    subtleBg: string;
    border: string;
  };
  border: {
    subtle: string;
    strong: string;
  };
};

export type ThemeRadius = {
  sm: number;
  md: number;
  lg: number;
  pill: number;
};

export type ThemeType = {
  /** Sopratitolo maiuscolo, spaziato. */
  kicker: TypeStyle;
  /** Titolo di schermata. */
  titleLg: TypeStyle;
  /** Titolo di sezione. */
  titleSm: TypeStyle;
  /** Nome di persona, etichetta forte. */
  name: TypeStyle;
  body: TypeStyle;
  bodyStrong: TypeStyle;
  small: TypeStyle;
  tiny: TypeStyle;
  /** Etichetta della tab bar. */
  tab: TypeStyle;
  /** Punteggio del match. */
  score: TypeStyle;
};

export type ThemeContract = {
  name: string;
  scheme: 'light' | 'dark';
  color: ThemeColors;
  radius: ThemeRadius;
  type: ThemeType;
};

/** Una direzione visiva nelle sue due varianti. */
export type ThemeSet = {
  light: ThemeContract;
  dark: ThemeContract;
};
