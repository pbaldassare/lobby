import { editorial, toCssVars } from '@lobby/shared/tokens';
import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--lobby-font-body',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--lobby-font-display',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Lobby Backoffice',
  description: 'Console per lo staff del venue — sigilli, presenze, moderazione',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="it" className={`${inter.variable} ${playfair.variable}`}>
      <head>
        {/* Colori e raggi generati dagli stessi token dell'app. Server
            component: zero JavaScript al client. Sta prima di `globals.css`
            nella cascata, quindi le regole del foglio possono sovrascriverlo
            se serve. */}
        <style id="lobby-tokens">{toCssVars(editorial)}</style>
      </head>
      <body>{children}</body>
    </html>
  );
}
