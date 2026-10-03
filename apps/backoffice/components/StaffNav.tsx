'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/dashboard', label: 'Panoramica' },
  { href: '/verify', label: 'Verifica e sigilli' },
  { href: '/moderation', label: 'Moderazione' },
  { href: '/poster', label: 'Codice della stanza' },
] as const;

export function StaffNav() {
  const pathname = usePathname();
  return (
    <nav className="nav" aria-label="Backoffice">
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
