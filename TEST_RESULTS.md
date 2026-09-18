# TEST_RESULTS — Lobby localhost

Data: 2026-09-18  
Piano: `TEST_PLAN.md`  
Ambiente: `origin/main` `ec1fb2e` + docs su branch `cursor/audit-test-plan-d416`  
App: membro http://127.0.0.1:8081 · back-office http://127.0.0.1:3000  
**Nessuna modifica al codice.** Un test (B2) ha scritto headline «Test headline audit» sulla card del membro di prova: da cancellare a mano da Card → Modifica se è ancora lì.

Account usato nei test automatici: membro già presente (email visibile in UI). Password non riportata qui. Nessun account staff in repo: Dashboard staff non esercitata.

---

## Riepilogo

| Esito | Test |
| --- | --- |
| Passati | A1, A2, A4, B1, B2, B3, C2, C3, D1 (wiring), E1, E2, E3, F1, F2 |
| Passati con riserva | C1 (blocca l’ingresso, errore in inglese), A3 (non entra, ma manca validazione client) |
| Falliti | nessuno bloccante sull’UI eseguita |
| Non eseguiti (manca staff / 2° utente / nativo) | A-M2 social completo, B-M2 signal, C-M1/C-M2 pass+visibilità, E-M1 staff, Apple nativo |

Video: `tests_A1_A4_welcome_login.mp4`, `tests_B_C_tabs_enter_scan.mp4`, `tests_D_E_F_oauth_backoffice.mp4` in artifacts.

---

## Test automatici

### A1 Welcome — PASS

http://127.0.0.1:8081/welcome mostra LinkedIn, Google, Apple, email.

<img alt="A1 welcome" src="/opt/cursor/artifacts/test_A1_welcome.webp" />

### A2 Credenziali errate — PASS

Messaggio: «Email o password non corretti.» Resta su welcome.

<img alt="A2 errore login" src="/opt/cursor/artifacts/test_A2_wrong_password.webp" />

### A3 Campi vuoti — RISERVA (bug UX confermato)

Non entra in app. Compare «Email o password non corretti.»  
Causa: `welcome.tsx` fa `email \|\| 'demo@lobby.app'` e `password \|\| 'demo'` anche fuori dalla demo, quindi un tap a vuoto chiama Auth vero.  
Correzione proposta: se i campi sono vuoti e `!isDemo`, mostrare «Inserisci email e password» e non chiamare Supabase.

<img alt="A3 campi vuoti" src="/opt/cursor/artifacts/test_A3_empty_fields.png" />

### A4 Login membro — PASS

Redirect `/discover`. Tab Stanza. Kato invisibile, lista persone vuota, copy privacy. Nessuna demo.

<img alt="A4 Stanza invisibile" src="/opt/cursor/artifacts/test_A4_stanza_invisible.webp" />

### B1 Tab — PASS

Stanza · Match · Progetti · Signal · Card. Match: «Ancora nessun match». Progetti: «Nessun progetto sulla tua card». Signal: «Nessuna richiesta in attesa». Card: Kato, «Nessun sigillo», «Chiedilo allo staff. I soci non possono emetterlo da sé.»

<img alt="B1 card" src="/opt/cursor/artifacts/test_B1_card.webp" />

### B2 Modifica profilo — PASS

`/edit-profile`: In evidenza / Offro / Cerco, Salva, nessun selettore ruolo. Headline salvata sulla card.

<img alt="B2 headline" src="/opt/cursor/artifacts/test_B2_headline_saved.webp" />

### B3 Settings + logout — PASS

Privacy: invisibile di default, solo nella stanza, si spegne in uscita, consenso reciproco. Esci → welcome.

<img alt="B3 settings" src="/opt/cursor/artifacts/test_B3_settings.webp" />

### C1 Enter senza pass — RISERVA

Wifi `not-a-network` → **«this room is not open on that network»** (inglese). Non entra. Gate OK, i18n no.  
Causa: RPC `claim_room_by_wifi` / messaggio Postgres passato crudo.  
Correzione: mappare in italiano in `PresenceProvider.enterRoom` (come già fatto per RLS).

<img alt="C1 errore wifi" src="/opt/cursor/artifacts/test_C1_enter_wifi_error.webp" />

### C2 Scan — PASS

`/scan`: fallback «Entra con il link» + «Usa la fotocamera». Web senza camera, niente crash.

### C3 Join senza query — PASS

«Stanza non trovata» / «Il link non contiene una stanza.» Non dump in una stanza.

<img alt="C3 join" src="/opt/cursor/artifacts/test_C3_join_no_room.webp" />

### D1 Google OAuth — PASS (wiring); provider spento in Dashboard

Redirect `…/auth/v1/authorize?provider=google&redirect_to=http://127.0.0.1:8081/auth/callback`  
JSON: `Unsupported provider: provider is not enabled`.  
Causa: Google non abilitato nel progetto Supabase.  
Correzione: Dashboard → Authentication → Providers (vedi `supabase/AUTH_PROVIDERS.md`). Dopo l’enable, lo stesso tap deve aprire Google e tornare a `/auth/callback`.

<img alt="D1 provider disabled" src="/opt/cursor/artifacts/test_D1_google_oauth.png" />

### E1 Login staff — PASS

http://127.0.0.1:3000/ → `/login`, «Staff sign in», membri esclusi.

<img alt="E1 staff login" src="/opt/cursor/artifacts/test_E1_staff_login.png" />

### E2 Membro sul back-office — PASS

«Access denied. Backoffice is for venue staff and admins only.» Niente dashboard.

<img alt="E2 member denied" src="/opt/cursor/artifacts/test_E2_member_denied.png" />

### E3 Rotte protette — PASS

`/dashboard` e `/verify` senza sessione → `/login?next=%2Fdashboard` e `/login?next=%2Fverify`.

### F1 404 — PASS

«Qui non c’è niente» + «Torna all’inizio». Nessun crash.

<img alt="F1 404" src="/opt/cursor/artifacts/test_F1_404.png" />

### F2 Callback senza code — PASS

«Accesso non riuscito» / «Il provider non ha restituito una sessione.» + «Torna all’accesso».

<img alt="F2 callback" src="/opt/cursor/artifacts/test_F2_callback.png" />

---

## Console / network

- Console Discover/Settings: niente errori rossi. Warning React Native Web su `shadow*` (stile, non funzionale). Invito React DevTools.
- Network A4: login password verso `mjzjracjadlybvdttgto.supabase.co` OK.
- Network D1: `GET /auth/v1/authorize?provider=google` → **400** `provider is not enabled` (atteso finché Dashboard è spenta).
- Realtime: nel codice i listener usano `schema: 'public'` (`useRoomPeople.ts`, `useChat.ts`) mentre i dati sono su `lobby`. Non visibile in questi test (utente solo, invisibile, niente chat). Va corretto prima di testare due persone in stanza.

---

## Fallimenti / debiti (causa + correzione, senza patchare ora)

| ID | Cosa | Causa probabile | Correzione proposta |
| --- | --- | --- | --- |
| A3 | Submit a vuoto parla con Auth | `email \|\| 'demo@lobby.app'` in `welcome.tsx` | Validare campi se `!isDemo` |
| C1 | Errore wifi in inglese | RPC message non mappato | Mapping italiano in `enterRoom` |
| D1 | Social non completa | Provider Google/LinkedIn/Apple off in Dashboard | Abilitare provider + redirect `lobby://**` e localhost |
| — | Visibilità senza pass (non esercitato in UI senza pass valido) | `heartbeat_presence` DEFINER | Aggiungere `has_valid_pass` in SQL |
| — | Signal fuori stanza | RLS INSERT senza `can_discover` | Allineare policy a Edge `send-signal` |
| — | Live presence/chat | Realtime schema `public` | `schema: 'lobby'` + pubblicazione Realtime |
| E-M1 | Staff dashboard | Nessun utente staff in questo run | Fornire account staff per un secondo giro |

---

## Test manuali ancora da fare (tu)

Vedi `TEST_PLAN.md`: A-M1 signup, A-M2 social dopo Dashboard, B-M1 progetti, B-M2 signal a due, C-M1 QR/wifi seed, C-M2 toggle visibilità, E-M1 staff (sigillo, poster, moderation).
