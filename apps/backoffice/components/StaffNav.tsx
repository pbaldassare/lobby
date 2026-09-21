'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/istanze', label: 'Stanze' },
  { href: '/qr', label: 'QR' },
  { href: '/registrati', label: 'Registrati' },
  { href: '/risultati', label: 'Risultati' },
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
