/** Messaggi utente: mai il testo grezzo di Postgres/GoTrue. */
export function lobbyUserError(message: string | undefined | null): string | null {
  if (!message) return null;
  if (/invalid login credentials/i.test(message)) return 'Email o password non corretti.';
  if (/email not confirmed/i.test(message)) return 'Conferma l’email prima di entrare.';
  if (/user already registered/i.test(message)) return 'Questo account esiste già. Accedi.';
  if (/provider is not enabled/i.test(message)) {
    return 'Questo accesso non è ancora attivo. Riprova tra poco o usa l’email.';
  }
  if (/unable to exchange external code|invalid (jwt|id.?token|grant)/i.test(message)) {
    return 'Il provider non ha confermato l’accesso. Riprova.';
  }
  if (/row-level security|violates/i.test(message)) {
    return 'Serve un permesso valido per entrare in questa stanza.';
  }
  if (/valid pass required/i.test(message)) {
    return 'Serve un permesso valido per apparire in stanza.';
  }
  if (/not open on that network|wifi network not allowed/i.test(message)) {
    return 'Questa stanza non è aperta su quella rete.';
  }
  if (/not open to /i.test(message)) {
    return 'Questa stanza non è aperta al dominio della tua email.';
  }
  if (/hidden apple email/i.test(message)) {
    return 'L’email nascosta di Apple non può aprire un ingresso del venue.';
  }
  if (/email not confirmed/i.test(message)) return 'Conferma l’email prima di usare questo ingresso.';
  if (/no email on this account/i.test(message)) return 'Su questo account manca un’email.';
  if (/room is closed/i.test(message)) return 'La stanza è chiusa.';
  if (/room not found/i.test(message)) return 'Stanza non trovata.';
  if (/not authenticated|not signed in/i.test(message)) return 'Non hai fatto l’accesso.';
  if (/enter a room first/i.test(message)) return 'Entra in una stanza prima.';
  if (/no sealed membership/i.test(message)) {
    return 'Serve il sigillo del venue per entrare da socio.';
  }
  if (/does not open with membership/i.test(message)) {
    return 'Questa stanza non si apre con la membership.';
  }
  if (/not discoverable/i.test(message)) {
    return 'Potete vedervi solo se siete entrambi visibili nella stessa stanza.';
  }
  if (/daily signal limit/i.test(message)) return 'Hai esaurito i signal di oggi.';
  if (/already connected/i.test(message)) return 'Siete già connessi.';
  if (/already pending/i.test(message)) return 'La richiesta è già in attesa.';
  if (/blocked/i.test(message)) return 'Non puoi contattare questa persona.';
  if (/invalid (code|qr)/i.test(message) || /code expired|wrong code/i.test(message)) {
    return 'Il codice non è valido o è scaduto.';
  }
  return message;
}
