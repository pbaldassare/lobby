import type { Metadata } from 'next';
import { Inter, Poppins, Space_Grotesk } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body-loaded',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display-loaded',
  display: 'swap',
});

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['500'],
  variable: '--font-wordmark-loaded',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Lobby Backoffice',
  description: 'Venue staff console — seals, presence, moderation',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${spaceGrotesk.variable} ${poppins.variable}`}
    >
      <body style={{ fontFamily: 'var(--font-body-loaded), var(--font-body)' }}>
        {children}
      </body>
    </html>
  );
}
