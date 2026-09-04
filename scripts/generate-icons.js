import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createPng(width, height, colorFn) {
  // Simple PNG encoder using Node's built-in zlib
  const rawData = Buffer.alloc(height * (1 + width * 4));
  let offset = 0;

  for (let y = 0; y < height; y++) {
    rawData[offset++] = 0; // Filter type 0 (None)
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = colorFn(x, y, width, height);
      rawData[offset++] = r;
      rawData[offset++] = g;
      rawData[offset++] = b;
      rawData[offset++] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData);

  function crc32(buf) {
    let c;
    const table = [];
    for (let n = 0; n < 256; n++) {
      c = n;
      for (let k = 0; k < 8; k++) {
        c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
      }
      table[n] = c;
    }
    let crc = 0 ^ (-1);
    for (let i = 0; i < buf.length; i++) {
      crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
    }
    return (crc ^ (-1)) >>> 0;
  }

  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const toCrc = Buffer.concat([typeBuf, data]);
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc32(toCrc), 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 6; // color type 6: RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace

  const ihdr = makeChunk('IHDR', ihdrData);
  const idat = makeChunk('IDAT', compressed);
  const iend = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Icon generator function: Brand theme of Gbê ou Moument (Ivorian Orange #E65A00 + Deep Emerald #061910)
function brandIcon(isMaskable) {
  return (x, y, w, h) => {
    const cx = w / 2;
    const cy = h / 2;
    const dx = x - cx;
    const dy = y - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const maxR = w / 2;

    // Outer background: dark emerald gradient
    const bgFactor = 1 - (dist / (maxR * 1.4));
    let r = Math.floor(5 + 10 * bgFactor);
    let g = Math.floor(20 + 35 * bgFactor);
    let b = Math.floor(14 + 20 * bgFactor);
    let a = 255;

    if (!isMaskable && dist > maxR - 2) {
      // Rounded corner transparent for standard icons
      const cornerR = w * 0.22;
      const nx = Math.max(0, Math.abs(dx) - (w / 2 - cornerR));
      const ny = Math.max(0, Math.abs(dy) - (h / 2 - cornerR));
      if (Math.sqrt(nx * nx + ny * ny) > cornerR) {
        return [0, 0, 0, 0];
      }
    }

    // Inner glowing emblem: circle/squircle badge
    const badgeR = isMaskable ? w * 0.38 : w * 0.42;
    if (dist <= badgeR) {
      // Outer rim
      if (dist > badgeR - (w * 0.03)) {
        return [230, 90, 0, 255]; // Vivid Orange rim #E65A00
      }
      // Inner gradient
      const innerDist = dist / badgeR;
      r = Math.floor(230 * (1 - innerDist * 0.7) + 16 * (innerDist * 0.7));
      g = Math.floor(90 * (1 - innerDist * 0.7) + 185 * (innerDist * 0.7));
      b = Math.floor(0 * (1 - innerDist * 0.7) + 129 * (innerDist * 0.7));

      // Stylized letter "G" or center diamond
      const diamondDist = Math.abs(dx) + Math.abs(dy);
      if (diamondDist < badgeR * 0.45) {
        return [255, 255, 255, 255];
      }
    }

    return [r, g, b, a];
  };
}

// Generate 192x192
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createPng(192, 192, brandIcon(false)));
console.log('Created pwa-192x192.png');

// Generate 512x512
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createPng(512, 512, brandIcon(false)));
console.log('Created pwa-512x512.png');

// Generate maskable 512x512
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), createPng(512, 512, brandIcon(true)));
console.log('Created pwa-maskable-512x512.png');

// Generate apple-touch-icon 180x180
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createPng(180, 180, brandIcon(false)));
console.log('Created apple-touch-icon.png');

// Generate favicon.ico (using 64x64 PNG format)
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), createPng(64, 64, brandIcon(false)));
console.log('Created favicon.ico');
