# Lobby — analisi e piano di test

Data: 2026-09-18  
Repo allineata a `origin/main` (`ec1fb2e`).  
**Nessuna modifica al codice applicativo in questo lavoro.**

Localhost usato:

| Superficie | URL | Come si avvia |
| --- | --- | --- |
| App membro (Expo web / PWA) | http://127.0.0.1:8081 | `npx expo start --web --port 8081` in `apps/mobile` |
| Back-office (Next.js) | http://127.0.0.1:3000 | `npm run start --workspace=@lobby/backoffice` (serve un `next build` precedente) |
| PWA statica (export) | http://127.0.0.1:4173 | `npm run export:web` + static server — può essere più vecchia di Metro |

Credenziali: i test automatici usano un account **membro** già presente nel progetto Supabase. Non committare password. Un account **staff** non è documentato in repo: i test staff si fermano al rifiuto di un membro.

---

## FASE 1 — Analisi

### Struttura

Monorepo npm workspaces.

| Pacchetto | Path | Ruolo |
| --- | --- | --- |
| `@lobby/mobile` | `apps/mobile` | Expo 57 + RN 0.86 + expo-router. Stesso codice per nativo (EAS) e PWA (Cloudflare Pages `lobby-app`) |
| `@lobby/backoffice` | `apps/backoffice` | Next.js 16, OpenNext → Pages `lobby` |
| `@lobby/shared` | `packages/shared` | tipi, UI, tema, client Supabase schema `lobby` |
| `apps/web` | stub deprecato | non usare |
| Backend | `supabase/` | Postgres schema `lobby`, RLS, Edge Functions |

Progetto Supabase condiviso Rank AI / Mediplan / Lobby: `mjzjracjadlybvdttgto`.  
Schema API Lobby: `lobby`. Helper: `lobby_private` (non esposto in PostgREST).

### Dipendenze rilevanti

- Expo `~57.0.16`, expo-router, expo-apple-authentication, expo-web-browser
- Next `^16.2`, `@supabase/ssr` `^0.6`, `@supabase/supabase-js` `^2.52–2.53`
- **Nessun test automatico** nel repo (`*.test.*` / script `test` assenti)

### Frontend — mappe rotte

**Membro**

| Rotta | Cosa fa |
| --- | --- |
| `/` | gate sessione → welcome o Stanza |
| `/(auth)/welcome` | LinkedIn / Google / Apple + email |
| `/auth/callback` | ritorno OAuth PKCE |
| `/(app)/(tabs)/discover` | presenza, visibilità, persone in stanza |
| `…/matches` | affinità |
| `…/showcase` | progetti |
| `…/signals` | signal, chat, intro |
| `…/card` | identità e sigillo |
| `/join`, `/enter`, `/scan` | ingresso stanza (QR / mail / socio / wifi) |
| `/settings`, `/edit-profile`, `/qr`, `/member-access` | account |
| `/chat/[id]`, `/introduce`, `/invite-guest` | dopo connessione |

**Back-office**

| Rotta | Cosa fa |
| --- | --- |
| `/login` | staff email/password |
| `/dashboard` | stats venue |
| `/verify` | membership + sigillo |
| `/access` | canali di ingresso |
| `/poster` | QR stanza |
| `/moderation` | report e blocchi |
| `/auth/callback` | OAuth; rifiuta i membri |

### Auth

- Membro: email, Google, LinkedIn OIDC, Apple (nativo iOS + OAuth altrove). Primo tap social = signup (`handle_new_user`).
- Staff: `signInWithPassword` + `profiles.role` in `{staff, admin}`; i membri vengono sloggati.
- Middleware back-office rinfresca la sessione e ripete il gate sul ruolo.
- Sign-out membro: cancella la propria riga `presence` poi `auth.signOut`.
- Provider social: da abilitare a mano in Dashboard (vedi `supabase/AUTH_PROVIDERS.md`). Oggi Google risponde ancora `provider is not enabled`.

### Edge Functions (`supabase/functions/`)

| Funzione | Chi chiama | Scrittura |
| --- | --- | --- |
| `issue-seal` | JWT + RPC `lobby.issue_seal` (service_role) | sigillo solo se `is_venue_staff` |
| `send-signal` | JWT; `p_from` forzato all’utente | signal con discovery + rate limit |
| `compute-matches` | JWT + riga presence nella stanza | ricalcolo **di tutte** le coppie visibili |

CORS `Access-Control-Allow-Origin: *`. `verify_jwt = true` in `config.toml`.  
Il client mobile rifiuta `issue-seal` in `apps/mobile/lib/supabase.ts` (difesa extra; il vero blocco è SQL).

### Schema, RLS, RPC

Ogni tabella `lobby.*` ha RLS **e** FORCE RLS. Anon: usage sullo schema, **nessun** privilegio tabella.

Regole prodotto (privacy):

| Regola | Stato |
| --- | --- |
| Invisibile di default | OK (`is_visible` default false; INSERT presenza richiede false) |
| Visibile solo nella stanza corrente | OK (`share_visible_room` / `can_discover`) |
| Visibilità off in uscita | Parziale: delete client + revoke pass; sweep scadenza non schedulato |
| Connessione solo reciproca | Quasi: Edge `send_signal` richiede discovery; INSERT RLS su `signals` **no** |
| Sigillo dal venue | OK (trigger + RPC service_role) |
| Invisibilità selettiva | OK (`blocks`); in UI non c’è lista per sbloccare |

RPCs privilegiati (`issue_seal`, `send_signal`, `compute_matches_for_room`, `sweep_expired_presence`): EXECUTE solo `service_role`.

### Variabili d’ambiente

| Var | Dove | Note |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` / `ANON_KEY` | back-office | pubbliche, RLS |
| `EXPO_PUBLIC_SUPABASE_*` | mobile | pubbliche |
| `EXPO_PUBLIC_WEB_ORIGIN` | QR / join | pubblica |
| `EXPO_PUBLIC_DEMO` | demo senza DB | |
| `SUPABASE_SERVICE_ROLE_KEY` | server / Edge | **mai** `NEXT_PUBLIC_` / `EXPO_PUBLIC_` |

`apps/backoffice/.env.local` è gitignored e in questo ambiente contiene solo URL+anon, **niente** service_role.  
Fallback anon JWT è inlined in `apps/mobile/lib/env.ts`, `apps/backoffice/lib/env.ts`, `next.config.ts`, `wrangler.jsonc` (chiave publishable, non service_role). `createLobbySupabaseClient` lancia se la stringa contiene `service_role`.

### Gestione errori

- Auth membro: mapping italiano per credenziali, email non confermata, provider disabilitato.
- Ingresso stanza: RLS → «Serve un permesso valido…».
- Hook (`useRoomPeople`, `useMatches`, `useSignals`, …): spesso `console.warn` + lista vuota, niente banner.
- Mix IT/EN (`Not signed in`, login staff in inglese).
- Welcome: campi vuoti mandano `demo@lobby.app` / `demo` al backend **anche fuori dalla demo**.

---

### Problemi trovati

1. **`heartbeat_presence` non richiede un pass valido** (`supabase/migrations/20260730172100_lobby_helpers.sql`). RPC SECURITY DEFINER bypassa RLS. `PresenceProvider.setVisible` la chiama: si può diventare visibili senza permesso di stanza. Impatto privacy alto.
2. **INSERT RLS su `signals` senza `can_discover`** (`20260730172110_lobby_rls_policies_core.sql`). L’Edge Function è più stretta; il Data API no. Si può signalare chi non è in stanza.
3. **`compute-matches` restituisce tutte le coppie della stanza** (`supabase/functions/compute-matches/index.ts`), anche match di terzi. Basta una riga presence (anche invisibile).
4. **Realtime su schema `public`** invece di `lobby` (`apps/mobile/hooks/useRoomPeople.ts`, `useChat.ts`). Gli aggiornamenti live non arrivano.
5. **IDOR back-office con service_role**: `addRoomAccessAction` / `removeRoomAccessAction` / `removeBlockAction` / `listRoomAccess` non legano sempre riga↔venue (`apps/backoffice/lib/actions/access.ts`, `moderation.ts`).
6. **`profiles_insert_own` non forza `role=member`**. L’UPDATE è protetto; un INSERT orfano potrebbe crearsi `admin`.
7. **Welcome vuoto → login `demo@lobby.app`**.
8. **Catalogo `room_access` SELECT per ogni authenticated** (param wifi visibili).
9. **`claim_room_by_email` senza email confermata**; `claim_room_by_wifi` = conoscenza di una stringa.
10. **Sweep presenza scaduta** non è agganciato a un cron.
11. **Nessuna test suite**.
12. **Advisor Supabase sul progetto condiviso**: decine di `SECURITY DEFINER` eseguibili da `anon` nello schema **`public` (Mediplan)**, non Lobby. Rischio di progetto condiviso, non del codice Lobby. Password leaked-protection Auth disattivata. `rankai.rate_limits` ha RLS senza policy.

### Ottimizzazioni consigliate (per impatto)

1. **Alto — privacy:** `heartbeat_presence` deve chiamare `has_valid_pass` (e allineare visibilità a RLS). Togliere il fallback `presence.update` se l’RPC fallisce, o farlo rispettare le stesse regole.
2. **Alto — privacy:** allineare `signals_insert_own_from` a `can_discover` + stesso-room; o revocare INSERT authenticated e usare solo Edge.
3. **Alto — leak:** filtrare la risposta di `compute-matches` al caller; richiedere `is_visible`.
4. **Alto — prodotto:** Realtime `schema: 'lobby'` (e tabelle in pubblicazione Realtime).
5. **Medio — back-office:** ogni action service_role deve filtrare `venue_id` della riga; `listRoomAccess` con `requireVenueStaff`.
6. **Medio — identità:** `profiles_insert_own` WITH CHECK `role = 'member'`; confermare email prima di `claim_room_by_email`.
7. **Medio — UX:** non fare fallback a `demo@lobby.app` se la demo è spenta; banner errore sugli hook; italiano uniforme.
8. **Medio — ops:** cron `sweep_expired_presence`; abilitare provider OAuth + automatic linking.
9. **Basso:** lista blocchi in Settings; indici su `intros`; CORS Edge più stretto; spostare RPC DEFINER in `lobby_private`.
10. **Basso / condiviso:** revocare EXECUTE anon sulle RPC `public.*` Mediplan; HaveIBeenPwned su Auth.

### Rischi di sicurezza (sintesi)

| Livello | Rischio |
| --- | --- |
| Alto | Visibilità senza pass via heartbeat; signal fuori stanza via Data API; leak match di terzi |
| Alto (progetto condiviso) | RPC Mediplan `SECURITY DEFINER` chiamabili da `anon` su `public` |
| Medio | IDOR staff cross-venue; eventuale self-admin via INSERT profilo; wifi/email claim deboli |
| Basso | Chiave anon in source (ok se RLS tiene); CORS `*`; catalogo canali visibile |
| OK | Nessuna `service_role` nel client; sigillo non self-service; RLS+FORCE su ogni tabella Lobby; trigger anti-escalation sul **UPDATE** ruolo |

---

## FASE 2 — Piano test

Flussi principali: welcome/auth, sessione membro, tab, card/profilo, ingresso stanza, privacy visibilità, OAuth, back-office gate, 404.

### Come leggere i test

- **Automatico:** lo esegue l’agente in Chrome su localhost.
- **Manuale:** passi per te, con risultato atteso.

---

### Flusso A — Welcome / login membro

**Automatico A1 — Welcome**  
Apri http://127.0.0.1:8081/  
Atteso: titolo «Accedi o iscriviti»; tre bottoni LinkedIn / Google / Apple; divider «oppure con email»; campi email/password.

**Automatico A2 — Credenziali errate**  
Email `nessuno@invalid.lobby` + password casuale → «Accedi con email».  
Atteso: messaggio italiano «Email o password non corretti.» Resta su welcome.

**Automatico A3 — Campi vuoti**  
Svuota i campi, «Accedi con email».  
Atteso desiderato: validazione / errore.  
Atteso attuale (bug noto): tenta `demo@lobby.app` / `demo`.

**Automatico A4 — Login membro valido**  
Accedi con l’account membro di test.  
Atteso: redirect a `/(app)/(tabs)/discover` (Stanza). Non deve comparire un elenco persone se invisibile.

**Manuale A-M1 — Signup email**  
1. Welcome → email nuova che controlli → «Crea un account con email».  
2. Se la conferma email è off, entri subito; se è on, compare l’invito a confermare.  
Atteso: riga in `lobby.profiles`; **non** visibile in nessuna stanza.

**Manuale A-M2 — Social (dopo Dashboard)**  
1. Abilita Google / LinkedIn / Apple + redirect `http://localhost:8081/auth/callback`.  
2. «Accedi o iscriviti con Google» su un account nuovo, poi di nuovo.  
Atteso: primo tap crea profilo; secondo fa login. Hide My Email Apple non deve sbloccare un pass su dominio venue.

---

### Flusso B — Shell membro (CRUD-lite / pagine chiave)

**Automatico B1 — Tab**  
Da Stanza: Match, Progetti, Signal, Card.  
Atteso: etichette visibili; nessuna crash; Card mostra identità e copy «Il sigillo lo rilascia il locale.»

**Automatico B2 — Modifica profilo**  
Card → Modifica. Cambia headline (o lascialo uguale) e salva se c’è un salva.  
Atteso: form con nome, headline, azienda, offer/seek; niente campo ruolo.

**Automatico B3 — Settings e logout**  
Dalla Card o dal chrome UI apri settings (`/settings`) se raggiungibile; altrimenti vai a http://127.0.0.1:8081/settings  
Atteso: testo privacy (invisibile di default); «Esci» → welcome.

**Manuale B-M1 — Progetto**  
1. Tab Progetti.  
2. Crea/modifica un progetto se l’UI lo consente.  
Atteso: vedi solo i tuoi; `private_deck_url` non in chiaro ad altri.

**Manuale B-M2 — Signal reciproco**  
Due telefoni/browser, entrambi visibili nella stessa stanza, non bloccati.  
1. A apre la card di B → segnala.  
2. B accetta.  
Atteso: chat; senza accettazione nessuna chat. Fuori stanza il signal deve fallire (oggi può passare dal Data API: da verificare).

---

### Flusso C — Ingresso stanza e visibilità

**Automatico C1 — Enter senza permesso**  
Dopo login: http://127.0.0.1:8081/enter → tenta ingresso email o wifi vuoto.  
Atteso: errore (permesso / rete); **non** compari nella stanza.

**Automatico C2 — Scan**  
http://127.0.0.1:8081/scan  
Atteso: schermata scansione o fallback incolla QR (web).

**Automatico C3 — Join senza query**  
http://127.0.0.1:8081/join  
Atteso: non entra in una stanza a caso; messaggio o form, presenza resta assente.

**Manuale C-M1 — QR / wifi seed**  
1. Dal back-office Poster (staff) o dal seed: codice stanza / wifi `lobby-house` se ancora valido.  
2. Scan o Enter → wifi.  
Atteso: presenza **invisibile**; lista persone vuota finché non attivi visibilità.

**Manuale C-M2 — Toggle visibilità**  
1. Entra con pass.  
2. Attiva visibilità.  
3. In un altro account visibile nella stessa stanza, compari.  
4. Esci / «Esci dalla stanza».  
Atteso: sparisci per gli altri. (Attenzione: heartbeat può tenere visibili senza pass — da confermare.)

---

### Flusso D — OAuth wiring

**Automatico D1 — Google**  
Welcome → «Accedi o iscriviti con Google».  
Atteso oggi: redirect `…/auth/v1/authorize?provider=google` poi `provider is not enabled` **finché** Dashboard non abilita Google.  
Atteso dopo enable: schermata Google, ritorno `/auth/callback`, sessione.

**Manuale D-M1 — LinkedIn e Apple**  
Stesso schema. Su iPhone: foglio nativo Apple dopo rebuild EAS.

---

### Flusso E — Back-office

**Automatico E1 — Login page**  
http://127.0.0.1:3000/ → redirect `/login`.  
Atteso: «Staff sign in»; form email/password; copy che i membri non entrano.

**Automatico E2 — Membro rifiutato**  
Login staff con l’account **membro**.  
Atteso: «Access denied. Backoffice is for venue staff and admins only.» (o `?error=forbidden`). Resta su login. Nessuna Dashboard.

**Automatico E3 — Rotte protette**  
Apri http://127.0.0.1:3000/dashboard e `/verify` senza sessione staff.  
Atteso: redirect `/login?next=…`.

**Manuale E-M1 — Staff**  
1. Login con utente `staff`/`admin` assegnato in `venue_staff`.  
2. Dashboard, Verify (sigillo a un pending), Access, Poster, Moderation.  
Atteso: sigillo solo da qui; Poster mostra codice; un membro **non** può emettere sigillo dall’app.

---

### Flusso F — Errori / edge

**Automatico F1 — 404 membro**  
http://127.0.0.1:8081/questa-rotta-non-esiste  
Atteso: schermata not-found Lobby, non crash bianco.

**Automatico F2 — Callback OAuth senza code**  
http://127.0.0.1:8081/auth/callback  
Atteso: attesa poi timeout «Accesso non riuscito» e bottone torna all’accesso (se non c’è sessione).

**Manuale F-M1 — Console**  
DevTools → Console / Network su welcome, login, stanza.  
Atteso: niente 401 a ripetizione; niente stack React; chiamate PostgREST su schema `lobby`.

---

### Fuori scope (non eseguibili in Chrome da solo)

- Sign in with Apple nativo (serve binary EAS + capability).
- Camera QR su desktop (fallback incolla).
- Push nativi.
- RLS da un secondo utente in parallelo (serve due sessioni: copri con test manuale B-M2 / C-M2).
- Deploy Cloudflare / EAS.
