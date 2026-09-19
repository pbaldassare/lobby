/** Etichette visibili nello staff console. I valori DB restano in inglese. */

export function roleLabel(role: string): string {
  switch (role) {
    case 'staff':
      return 'Staff';
    case 'admin':
      return 'Amministratore';
    case 'member':
      return 'Membro';
    default:
      return role;
  }
}

export function membershipStatusLabel(status: string): string {
  switch (status) {
    case 'pending':
      return 'In attesa';
    case 'verified':
      return 'Verificato';
    case 'rejected':
      return 'Rifiutato';
    case 'revoked':
      return 'Revocato';
    default:
      return status;
  }
}

export function reportStatusLabel(status: string): string {
  switch (status) {
    case 'open':
      return 'Aperta';
    case 'reviewing':
      return 'In revisione';
    case 'resolved':
      return 'Risolta';
    case 'dismissed':
      return 'Archiviata';
    default:
      return status;
  }
}

export function accessMethodLabel(method: string): string {
  switch (method) {
    case 'qr':
      return 'QR a rotazione';
    case 'wifi_portal':
      return 'Rete Wi‑Fi';
    case 'email_domain':
      return 'Dominio email';
    case 'invite':
      return 'Invito';
    case 'membership':
      return 'Socio col sigillo';
    default:
      return method;
  }
}

export function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString('it-IT');
}

/** Finestra oraria di una stanza. Null = sempre aperta. */
export function roomWindowLabel(
  opensAt: string | null,
  closesAt: string | null,
): string {
  if (!opensAt && !closesAt) return 'Sempre aperta';
  if (opensAt && closesAt) {
    return `${formatWhen(opensAt)} – ${formatWhen(closesAt)}`;
  }
  if (opensAt) return `Da ${formatWhen(opensAt)}`;
  return `Fino a ${formatWhen(closesAt as string)}`;
}
