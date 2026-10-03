import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(__dirname, '../public');

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

/** Canvas cream #FAF7F2, accent #C9A227 — same tokens as the member UI. */
const CREAM = [250, 247, 242];
const GOLD = [201, 162, 39];

function png(size, maskable) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  const cx = (size - 1) / 2;
  const cy = cx;
  const outer = size * (maskable ? 0.32 : 0.38);
  const inner = outer * 0.62;
  const rows = [];
  for (let y = 0; y < size; y++) {
    const row = Buffer.alloc(1 + size * 3);
    for (let x = 0; x < size; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const d = Math.sqrt(dx * dx + dy * dy);
      const onRing = d <= outer && d >= inner;
      const ch = onRing ? GOLD : CREAM;
      row[1 + x * 3] = ch[0];
      row[2 + x * 3] = ch[1];
      row[3 + x * 3] = ch[2];
    }
    rows.push(row);
  }
  const idat = zlib.deflateSync(Buffer.concat(rows));
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'logo192.png'), png(192, false));
fs.writeFileSync(path.join(outDir, 'logo512.png'), png(512, false));
fs.writeFileSync(path.join(outDir, 'logo192-maskable.png'), png(192, true));
fs.writeFileSync(path.join(outDir, 'logo512-maskable.png'), png(512, true));
fs.writeFileSync(path.join(outDir, 'apple-touch-icon.png'), png(180, false));
console.log('Wrote PWA icons to', outDir);
