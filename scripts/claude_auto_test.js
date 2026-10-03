/**
 * Test automatico end-to-end di Lobby (app soci + backoffice staff).
 *
 *   node scripts/claude_auto_test.js
 *
 * Presuppone i due dev server già attivi:
 *   - app soci   → http://localhost:8082  (expo start --web --port 8082)
 *   - backoffice → http://localhost:3005  (next dev --port 3005)
 *
 * L'app soci gira in modalità dimostrativa (nessun apps/mobile/.env): tutte le
 * azioni restano in memoria nel browser e non scrivono su nessun database.
 * Sul backoffice lo script NON invia credenziali: quel login parla con il
 * progetto Supabase condiviso, che ospita anche altri prodotti in produzione.
 *
 * Ogni passo è isolato: se uno fallisce viene registrato e lo script prosegue.
 * Esito e log di console finiscono in report/results.json.
 */

const { chromium } = require('@playwright/test');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const MOBILE = process.env.LOBBY_MOBILE_URL || 'http://localhost:8082';
const BACKOFFICE = process.env.LOBBY_BACKOFFICE_URL || 'http://localhost:3005';
const OUT = path.resolve(__dirname, '..', 'report');
const SHOTS = path.join(OUT, 'screenshots');
const VIEWPORT = { width: 1280, height: 800 };

const stamp = Date.now();
const DEMO_EMAIL = `demo_claude_${stamp}@test.com`;
// Generata a ogni esecuzione e mai stampata: vive solo in memoria.
const DEMO_PASSWORD = `${crypto.randomBytes(9).toString('base64url')}aA1!`;

fs.mkdirSync(SHOTS, { recursive: true });
for (const f of fs.readdirSync(SHOTS)) {
  if (f.endsWith('.png')) fs.unlinkSync(path.join(SHOTS, f));
}

const results = [];
const consoleLog = [];
let page;

function watch(p, app) {
  p.on('console', (msg) => {
    const type = msg.type();
    if (type === 'error' || type === 'warning') {
      consoleLog.push({ app, type, text: msg.text().slice(0, 400) });
    }
  });
  p.on('pageerror', (err) => {
    consoleLog.push({ app, type: 'pageerror', text: String(err.message).slice(0, 400) });
  });
  p.on('requestfailed', (req) => {
    const url = req.url();
    // Le richieste interrotte dal cambio pagina non sono errori dell'app.
    if (req.failure()?.errorText === 'net::ERR_ABORTED') return;
    consoleLog.push({ app, type: 'requestfailed', text: `${req.method()} ${url.slice(0, 200)}` });
  });
}

/** Tra più elementi con lo stesso testo sceglie quello davvero in primo piano:
 *  il router tiene montate anche le tab non attive. */
async function topmost(locator) {
  const n = await locator.count();
  for (let i = 0; i < n; i++) {
    const el = locator.nth(i);
    if (!(await el.isVisible().catch(() => false))) continue;
    const onTop = await el
      .evaluate((node) => {
        const r = node.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) return false;
        const x = r.left + r.width / 2;
        const y = r.top + r.height / 2;
        if (x < 0 || y < 0 || x > window.innerWidth || y > window.innerHeight) return false;
        const hit = document.elementFromPoint(x, y);
        return Boolean(hit) && (node.contains(hit) || hit.contains(node));
      })
      .catch(() => false);
    if (onTop) return el;
  }
  return null;
}

async function waitFor(locator, what, timeout = 15000) {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    const el = await topmost(locator);
    if (el) return el;
    await page.waitForTimeout(200);
  }
  throw new Error(`non trovato in primo piano: ${what}`);
}

const byText = (text) =>
  typeof text === 'string' ? page.getByText(text, { exact: true }) : page.getByText(text);

const see = (text, timeout) => waitFor(byText(text), String(text), timeout);

async function tap(text, timeout) {
  const el = await see(text, timeout);
  await el.click();
  await page.waitForTimeout(350);
}

async function gone(text, timeout = 6000) {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    if (!(await topmost(byText(text)))) return true;
    await page.waitForTimeout(200);
  }
  return false;
}

async function tab(href) {
  const el = await waitFor(page.locator(`a[href="${href}"]`), `tab ${href}`);
  await el.click();
  await page.waitForTimeout(500);
}

/** Torna indietro con la freccia dell'intestazione, come farebbe una persona.
 *  Il tasto indietro del browser è provato a parte: ha un difetto suo. */
async function appBack() {
  const el = await waitFor(page.locator('[aria-label="Indietro"]'), 'freccia indietro');
  await el.click();
  await page.waitForTimeout(600);
}

async function browserBack() {
  await page.goBack().catch(() => undefined);
  await page.waitForTimeout(700);
}

async function step(id, title, fn, { shot = true } = {}) {
  const rec = { id, title, status: 'ok', notes: [], url: null, file: null, console: [] };
  const from = consoleLog.length;
  try {
    await fn(rec);
  } catch (err) {
    rec.status = 'error';
    rec.notes.push(String(err.message).split('\n')[0]);
  }
  await page.waitForTimeout(250);
  if (shot) {
    rec.file = `${id}.png`;
    await page.screenshot({ path: path.join(SHOTS, rec.file) }).catch((e) => {
      rec.notes.push(`screenshot fallito: ${e.message}`);
      rec.file = null;
    });
  }
  rec.url = page.url();
  rec.console = consoleLog.slice(from);
  if (rec.status === 'ok' && rec.console.some((c) => c.type !== 'warning' && !(rec.expected && rec.expected.test(c.text)))) rec.status = 'warn';
  results.push(rec);
  const mark = { ok: 'OK  ', warn: 'WARN', error: 'ERR ' }[rec.status];
  console.log(`${mark} ${id} — ${title}${rec.notes.length ? ` · ${rec.notes.join(' · ')}` : ''}`);
}

async function fillLogin() {
  await page.getByPlaceholder('nome@esempio.it').fill(DEMO_EMAIL);
  await page.getByPlaceholder('La tua password').fill(DEMO_PASSWORD);
}

async function run() {
  const browser = await chromium.launch();

  // ------------------------------------------------------------------ app soci
  const ctx = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 2,
    colorScheme: 'light',
    locale: 'it-IT',
  });
  page = await ctx.newPage();
  page.setDefaultTimeout(15000);
  watch(page, 'app');

  await step('01_benvenuto', 'Benvenuto', async (rec) => {
    // Il primo bundle di Metro può richiedere qualche minuto.
    await page.goto(MOBILE, { waitUntil: 'domcontentloaded', timeout: 300000 });
    await see('LOBBY', 300000);
    await see('Entra (dimostrativo)');
    rec.notes.push('modalità dimostrativa attiva');
  });

  await step('02_registrazione_compilata', 'Registrazione — modulo compilato', async (rec) => {
    await fillLogin();
    rec.notes.push(`account demo: ${DEMO_EMAIL}`);
  });

  await step('03_dopo_registrazione', 'Dopo la registrazione', async (rec) => {
    await tap('Non hai un account? Creane uno');
    await see('La stanza');
    await see('Sei qui, ma nessuno ti vede');
    rec.notes.push('in demo si entra subito nella stanza dimostrativa, invisibili');
  });

  await step('04_uscita', 'Impostazioni e uscita', async () => {
    await tab('/card');
    await see('La tua card');
    await tap('Impostazioni');
    await see('Accessi riservati');
  });

  await step('05_accesso', 'Accesso con le credenziali create', async () => {
    await tap('Esci');
    await see('Entra (dimostrativo)');
    await fillLogin();
    await tap('Entra (dimostrativo)');
    await see('Sei qui, ma nessuno ti vede');
  });

  await step('06_stanza_invisibile', 'Stanza — dentro, invisibile', async (rec) => {
    await see('Sei qui, ma nessuno ti vede');
    await see('Invisibile');
    const sw = await waitFor(page.getByRole('switch'), 'interruttore visibilità');
    const checked = await sw.getAttribute('aria-checked');
    rec.notes.push(`interruttore all'ingresso: aria-checked=${checked}`);
    if (checked === 'true') throw new Error('si entra già visibili: regola di prodotto violata');
  });

  await step('07_stanza_visibile', 'Stanza — visibile', async (rec) => {
    const sw = await waitFor(page.getByRole('switch'), 'interruttore visibilità');
    await sw.click();
    await see('Mia Chen');
    await see('87%');
    // Un lettore di schermo deve poter dire se sei visibile o no.
    const state = await sw.getAttribute('aria-checked');
    rec.notes.push(`interruttore acceso: aria-checked=${state}`);
    if (state !== 'true') rec.status = 'warn';
    const left = await topmost(page.getByText(/^· \d+h \d+m$|^· \d+m$/));
    rec.notes.push(left ? `conto alla rovescia: ${(await left.textContent()).trim()}` : 'conto alla rovescia non trovato');
  });

  await step('08_scheda_persona', 'Scheda della persona', async (rec) => {
    await tap('Mia Chen');
    await see('Manda un signal');
    await see('Come rompere il ghiaccio');
    await tap('Manda un signal');
    // Anche in dimostrazione il pulsante deve dire che cosa è successo.
    await see('Signal non inviato. In dimostrazione i signal non partono davvero.');
    rec.notes.push('in demo il signal non parte, e la scheda lo dice');
  });

  await step('09_affinita', 'Affinità', async (rec) => {
    await page.keyboard.press('Escape');
    if (!(await gone('Manda un signal', 2500))) {
      const scrim = await topmost(page.getByLabel('Chiudi'));
      if (scrim) await scrim.click({ position: { x: 20, y: 10 } });
    }
    if (!(await gone('Manda un signal'))) throw new Error('la scheda non si chiude');
    await tab('/matches');
    await see('Affinità');
    await see('Mia Chen');
    rec.notes.push('scheda persona chiusa correttamente');
  });

  await step('10_progetti', 'Progetti', async () => {
    await tab('/showcase');
    await see('Hearth Exchange');
  });

  await step('11_card', 'La tua card', async () => {
    await tab('/card');
    await see('La tua card');
    await see('Mostra il QR');
    await see(/Socio verificato/);
  });

  await step('12_qr', 'QR da mostrare', async (rec) => {
    await tap('Mostra il QR');
    await see(/Inquadralo per aprire questa card/);
    const svg = await page.locator('svg').count();
    rec.notes.push(`elementi svg in pagina: ${svg}`);
  });

  await step('13_modifica_profilo', 'Modifica profilo', async () => {
    await tap('Chiudi');
    await see('La tua card');
    await tap('Modifica profilo');
    const field = page.getByPlaceholder('Su cosa stai lavorando adesso');
    await field.waitFor();
    await field.fill('Test automatico: profilo modificato da Playwright.');
  });

  await step('14_profilo_salvato', 'Profilo salvato', async (rec) => {
    await tap('Salva');
    await see('La tua card');
    await see('Test automatico: profilo modificato da Playwright.');
    rec.notes.push('la modifica compare sulla card');
  });

  await step('15_impostazioni', 'Impostazioni', async (rec) => {
    await tap('Impostazioni');
    await see('Accessi riservati');
    await see('Scansiona un QR');
    await see('Esci');
    const label = await (await waitFor(page.locator('[aria-label="Indietro"], [aria-label$=", back"]'), 'freccia indietro')).getAttribute('aria-label');
    rec.notes.push(`etichetta accessibile della freccia indietro: "${label}"`);
    if (label !== 'Indietro') rec.status = 'warn';
  });

  await step('16_accessi_riservati', 'Accessi riservati', async () => {
    await tap('Accessi riservati');
    await see('Terrazza sul tetto — soci');
    await see('2 inviti per ospiti al mese');
  });

  await step('17_scansione', 'Scansione QR', async (rec) => {
    await appBack();
    await tap('Scansiona un QR');
    const found = await Promise.race([
      see('Serve la fotocamera', 8000).then(() => 'richiesta permesso'),
      see('Inquadra il QR del locale', 8000).then(() => 'mirino'),
    ]).catch(() => null);
    rec.notes.push(found ? `stato mostrato: ${found}` : 'nessun contenuto: permesso fotocamera indeterminato nel browser headless');
    if (!found) rec.status = 'warn';
  });

  await step('18_signal_in_arrivo', 'Signal — in arrivo', async () => {
    await appBack();
    await appBack();
    await tab('/signals');
    await see('In arrivo');
    await see('Nessuna richiesta in attesa');
  });

  await step('19_signal_inviati', 'Signal — inviati', async () => {
    await tap('Inviati');
    await see('Nessun signal in attesa');
  });

  await step('20_signal_chat', 'Signal — chat', async () => {
    const chat = await waitFor(page.getByRole('tab', { name: 'Chat' }), 'segmento Chat');
    await chat.click();
    await see('Ancora nessuna conversazione');
  });

  await step('21_presentazioni', 'Signal — presentazioni', async (rec) => {
    await tap(/^Presentazioni/);
    await see('Presenta due persone');
    await see('Accetta');
    await tap('Accetta');
    if (!(await gone('Accetta'))) throw new Error('"Accetta" non cambia lo stato della presentazione');
    rec.notes.push('la presentazione accettata esce da quelle in attesa');
  });

  await step('22_presenta', 'Presenta due persone', async () => {
    await tap('Presenta due persone');
    await see('Servono almeno due connessioni');
  });

  await step('23_uscita_stanza', 'Stanza — fuori', async () => {
    await appBack();
    await tab('/discover');
    await tap('Esci');
    await see('Entra nella stanza dimostrativa');
    await see('Scansiona il QR del locale');
  });

  await step('24_indietro_del_browser', 'Tasto indietro del browser', async (rec) => {
    // indietro da una schermata aperta → cambio tab → altra schermata → indietro
    await tab('/card');
    await tap('Mostra il QR');
    await browserBack();
    await tab('/signals');
    await tap(/^Presentazioni/);
    await tap('Presenta due persone');
    await see('Servono almeno due connessioni');
    await browserBack();
    const landed = new URL(page.url()).pathname;
    rec.notes.push(`atteso /signals, ottenuto ${landed}`);
    if (landed !== '/signals') {
      const out = Boolean(await topmost(byText('Entra (dimostrativo)')));
      throw new Error(`il secondo "indietro" porta su ${landed}${out ? ' e la sessione è persa' : ''}`);
    }
  });

  await step('25_pagina_inesistente', 'Pagina inesistente', async (rec) => {
    // Un indirizzo che non esiste deve rispondere 404: è la risposta giusta.
    rec.expected = /status of 404/;
    rec.notes.push("il server risponde 404, l'app mostra la sua schermata");
    await page.goto(`${MOBILE}/pagina-che-non-esiste`, { waitUntil: 'domcontentloaded' });
    await see("Qui non c'è niente", 30000);
  });

  await ctx.close();

  // -------------------------------------------------------- app soci, tema scuro
  const dark = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 2,
    colorScheme: 'dark',
    locale: 'it-IT',
  });
  page = await dark.newPage();
  page.setDefaultTimeout(15000);
  watch(page, 'app-scuro');

  await step('26_tema_scuro_benvenuto', 'Tema scuro — benvenuto', async (rec) => {
    await page.goto(MOBILE, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await see('LOBBY', 120000);
    const bg = await page.evaluate(() => {
      let el = document.elementFromPoint(5, 5);
      while (el) {
        const c = getComputedStyle(el).backgroundColor;
        if (c && c !== 'rgba(0, 0, 0, 0)') return c;
        el = el.parentElement;
      }
      return null;
    });
    if (bg !== 'rgb(14, 13, 12)') throw new Error(`fondo ${bg}: il tema scuro non è applicato`);
    rec.notes.push(`sfondo calcolato: ${bg}`);
  });

  await step('27_tema_scuro_stanza', 'Tema scuro — stanza', async () => {
    await tap('Entra (dimostrativo)');
    await see('Sei qui, ma nessuno ti vede');
    const sw = await waitFor(page.getByRole('switch'), 'interruttore visibilità');
    await sw.click();
    await see('Mia Chen');
  });

  await dark.close();

  // ---------------------------------------------------------------- backoffice
  const bo = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 2,
    colorScheme: 'light',
    locale: 'it-IT',
  });
  page = await bo.newPage();
  page.setDefaultTimeout(15000);
  watch(page, 'backoffice');

  await step('28_backoffice_login', 'Backoffice — accesso staff', async (rec) => {
    await page.goto(`${BACKOFFICE}/login`, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.getByRole('heading', { name: 'Staff sign in' }).waitFor({ timeout: 60000 });
    const font = await page
      .getByRole('heading', { name: 'Staff sign in' })
      .evaluate((h) => getComputedStyle(h).fontFamily);
    rec.notes.push(`font del titolo: ${font.split(',')[0]}`);
    const vars = await page.evaluate(
      () => (document.getElementById('lobby-tokens')?.textContent.match(/--lobby-/g) || []).length,
    );
    rec.notes.push(`custom property --lobby-* iniettate: ${vars}`);
  });

  await step('29_backoffice_validazione', 'Backoffice — validazione del modulo', async (rec) => {
    const url = page.url();
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.waitForTimeout(400);
    const empty = await page.evaluate(() => ({
      email: document.querySelector('#email').validity.valueMissing,
      password: document.querySelector('#password').validity.valueMissing,
    }));
    if (page.url() !== url) throw new Error('invio a vuoto non bloccato');
    rec.notes.push(`invio a vuoto bloccato (email mancante=${empty.email}, password mancante=${empty.password})`);

    await page.locator('#email').fill('non-una-mail');
    const bad = await page.evaluate(() => document.querySelector('#email').validity.typeMismatch);
    rec.notes.push(`email malformata rifiutata dal browser: ${bad}`);
    rec.notes.push('nessuna credenziale inviata: il login parla con un database di produzione condiviso');
  });

  await step('30_backoffice_rotte_protette', 'Backoffice — rotte protette', async (rec) => {
    for (const route of ['/dashboard', '/verify', '/moderation', '/poster']) {
      await page.goto(`${BACKOFFICE}${route}`, { waitUntil: 'domcontentloaded' });
      const landed = new URL(page.url()).pathname;
      rec.notes.push(`${route} → ${landed}`);
      if (!landed.startsWith('/login')) {
        throw new Error(`${route} raggiungibile senza sessione (finisce su ${landed})`);
      }
    }
  });

  await bo.close();
  await browser.close();

  const summary = {
    executedAt: new Date(stamp).toISOString(),
    viewport: VIEWPORT,
    demoEmail: DEMO_EMAIL,
    totals: {
      steps: results.length,
      ok: results.filter((r) => r.status === 'ok').length,
      warn: results.filter((r) => r.status === 'warn').length,
      error: results.filter((r) => r.status === 'error').length,
      screenshots: results.filter((r) => r.file).length,
    },
    results,
    console: consoleLog,
  };
  fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify(summary, null, 2));

  const t = summary.totals;
  console.log(`\n${t.steps} passi · ${t.ok} ok · ${t.warn} con avvisi · ${t.error} errori · ${t.screenshots} screenshot`);
  console.log(`dettaglio in ${path.join(OUT, 'results.json')}`);
}

run().catch((err) => {
  console.error('ERRORE FATALE:', err);
  process.exit(1);
});
