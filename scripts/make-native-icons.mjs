// Generates native launcher icons + splash screens for Android & iOS
// from the master 1024px brand icon (brand/app-icon-1024.png).
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const root = process.cwd();
const master = path.join(root, 'brand', 'app-icon-1024.png');

const MIPMAP = (d) => path.join(root, 'android', 'app', 'src', 'main', 'res', `mipmap-${d}`);
const iosAppIcon = path.join(root, 'ios', 'App', 'App', 'Assets.xcassets', 'AppIcon.appiconset');

// Legacy launcher sizes per density (ic_launcher / ic_launcher_round)
const legacy = {
  mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192,
};
// Adaptive foreground canvas sizes per density (108dp * scale)
const adaptive = {
  mdpi: 108, hdpi: 162, xhdpi: 216, xxhdpi: 324, xxxhdpi: 432,
};

const BRAND_BG = { r: 5, g: 19, b: 13 };      // #05130D
const ADAPTIVE_BG = '#061910';                 // emerald behind adaptive foreground

function circleMaskSvg(size) {
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
       <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="#000"/>
     </svg>`
  );
}

async function roundCrop(size, fromPath) {
  return sharp(fromPath)
    .resize(size, size, { fit: 'cover' })
    .composite([{ input: circleMaskSvg(size), blend: 'dest-in' }])
    .png()
    .toBuffer();
}

async function main() {
  if (!fs.existsSync(master)) throw new Error('Missing master icon: ' + master);
  console.log('Master icon:', master);

  // ---- Android legacy launcher icons (square) & round (circular) ----
  for (const [dens, size] of Object.entries(legacy)) {
    const dir = MIPMAP(dens);
    fs.mkdirSync(dir, { recursive: true });
    await sharp(master).resize(size, size, { fit: 'cover' }).png().toFile(path.join(dir, 'ic_launcher.png'));
    await sharp(await roundCrop(size, master)).toFile(path.join(dir, 'ic_launcher_round.png'));
    console.log('  launcher', dens, size);
  }

  // ---- Android adaptive foreground (transparent canvas, centered circular emblem) ----
  for (const [dens, size] of Object.entries(adaptive)) {
    const dir = MIPMAP(dens);
    const emblemSize = Math.round(size * 0.58);
    const emblem = await roundCrop(emblemSize, master);
    const transparent = await sharp({ create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).png().toBuffer();
    await sharp(transparent)
      .composite([{ input: emblem, gravity: 'center' }])
      .png()
      .toFile(path.join(dir, 'ic_launcher_foreground.png'));
    console.log('  adaptive foreground', dens, size);
  }

  // Set adaptive-icon background to brand emerald
  const bgXml = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">${ADAPTIVE_BG}</color>
</resources>
`;
  fs.writeFileSync(path.join(root, 'android', 'app', 'src', 'main', 'res', 'values', 'ic_launcher_background.xml'), bgXml);

  // ---- iOS AppIcon (1024x1024) ----
  fs.mkdirSync(iosAppIcon, { recursive: true });
  await sharp(master).resize(1024, 1024, { fit: 'cover' }).png().toFile(path.join(iosAppIcon, 'AppIcon-512@2x.png'));
  console.log('  iOS AppIcon 1024');

  // ---- Splash screens: solid brand emerald ----
  const androidRes = path.join(root, 'android', 'app', 'src', 'main', 'res');
  const splashFiles = [];
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name === 'splash.png') splashFiles.push(p);
    }
  };
  walk(androidRes);
  for (const f of splashFiles) {
    const meta = await sharp(f).metadata();
    await sharp({ create: { width: meta.width, height: meta.height, channels: 4, background: { r: BRAND_BG.r, g: BRAND_BG.g, b: BRAND_BG.b, alpha: 255 } } }).png().toFile(f);
    console.log('  android splash', f, meta.width, 'x', meta.height);
  }

  // iOS splash images
  const iosSplashDir = path.join(root, 'ios', 'App', 'App', 'Assets.xcassets', 'Splash.imageset');
  for (const name of fs.readdirSync(iosSplashDir).filter((n) => n.endsWith('.png'))) {
    await sharp({ create: { width: 2732, height: 2732, channels: 4, background: { r: BRAND_BG.r, g: BRAND_BG.g, b: BRAND_BG.b, alpha: 255 } } }).png().toFile(path.join(iosSplashDir, name));
    console.log('  ios splash', name);
  }

  console.log('Done.');
}

main().catch((e) => { console.error(e); process.exit(1); });
