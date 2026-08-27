import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(__dirname, '../assets/images');

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const t = Buffer.from(type);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])));
  return Buffer.concat([len, t, data, crc]);
}

function png(w, h, r, g, b) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  const row = Buffer.alloc(1 + w * 3);
  row[0] = 0;
  for (let x = 0; x < w; x++) {
    row[1 + x * 3] = r;
    row[2 + x * 3] = g;
    row[3 + x * 3] = b;
  }
  const raw = Buffer.concat(Array.from({ length: h }, () => row));
  const idat = zlib.deflateSync(raw);
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

fs.mkdirSync(outDir, { recursive: true });

// Tinte della direzione editoriale. Restano scritte qui perché questo script
// gira fuori dal bundle e non può importare i token TypeScript: se cambia la
// direzione visiva, vanno aggiornate a mano insieme ad `app.json`.
// canvas #0E0D0C, accent #C9A227
const CANVAS = [14, 13, 12];
const ACCENT = [201, 162, 39];

const dark = png(1024, 1024, ...CANVAS);
const gold = png(1024, 1024, ...ACCENT);
fs.writeFileSync(path.join(outDir, 'icon.png'), dark);
fs.writeFileSync(path.join(outDir, 'splash-icon.png'), gold);
fs.writeFileSync(path.join(outDir, 'android-icon-foreground.png'), gold);
fs.writeFileSync(path.join(outDir, 'android-icon-background.png'), dark);
fs.writeFileSync(path.join(outDir, 'android-icon-monochrome.png'), gold);
fs.writeFileSync(path.join(outDir, 'favicon.png'), png(48, 48, ...ACCENT));
console.log('Wrote placeholder assets to', outDir);
