'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/dashboard', label: 'Panoramica' },
  { href: '/verify', label: 'Verifica e sigillo' },
  { href: '/moderation', label: 'Moderazione' },
  { href: '/poster', label: 'Poster QR' },
  { href: '/access', label: 'Accesso' },
] as const;

export function StaffNav() {
  const pathname = usePathname();
  return (
    <nav className="nav" aria-label="Navigazione back-office">
      {LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          data-active={
            pathname === link.href || pathname.startsWith(`${link.href}/`)
          }
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
