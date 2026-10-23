import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const iconSrc = path.join(root, "public", "R-app-icon-1024.png");
const splashLogoSrc = path.join(root, "public", "R-splash-logo-1024.png");

const androidRes = path.join(root, "android", "app", "src", "main", "res");
const iosAssets = path.join(root, "ios", "App", "App", "Assets.xcassets");

// Splash artwork: Capacitor's recommended 2732x2732 canvas with the logo
// centred at 1024px. iOS renders it with scaleAspectFill, so this reads as a
// logo roughly a third of the screen width on a phone.
const splashCanvas = 2732;
const splashLogoOnCanvas = 1024;

// Android adaptive icons are 108x108dp layers. The launcher is free to mask
// them, and the only area guaranteed to survive every mask is the centred
// 66dp circle. Keep the mark inside it instead of the full 108dp layer.
const adaptiveLayerDp = 108;
const adaptiveSafeZoneDp = 66;
// Leave a hair of room for pixel rounding at small densities.
const adaptiveSafeZoneMargin = 0.985;

// Android 12+ splash icon: 240dp drawable with the artwork inside the central
// 160dp circle. Legacy launches reuse the same asset, centred on the black
// window, so the logo looks identical before and after Android 12.
const splashIconDp = 240;

const densities = [
  ["mdpi", 1],
  ["hdpi", 1.5],
  ["xhdpi", 2],
  ["xxhdpi", 3],
  ["xxxhdpi", 4],
];

/**
 * The source logos are opaque white artwork on black. Convert luminance to
 * alpha and paint the mark white so the artwork can sit on a transparent
 * adaptive-icon layer (and on Android 13+ themed icons).
 */
async function loadTransparentMark(file) {
  const { data, info } = await sharp(file)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const rgba = Buffer.alloc(info.width * info.height * 4);
  for (let i = 0, o = 0; i < data.length; i += 3, o += 4) {
    rgba[o] = 255;
    rgba[o + 1] = 255;
    rgba[o + 2] = 255;
    rgba[o + 3] = Math.max(data[i], data[i + 1], data[i + 2]);
  }

  return { data: rgba, width: info.width, height: info.height };
}

function maxRadiusRatio({ data, width, height }) {
  const cx = (width - 1) / 2;
  const cy = (height - 1) / 2;
  let max = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] > 40) {
        const radius = Math.hypot(x - cx, y - cy);
        if (radius > max) max = radius;
      }
    }
  }

  return max / width;
}

async function writePng(src, dest, size) {
  await sharp(src)
    .resize(size, size, { fit: "contain", background: "#000000" })
    .flatten({ background: "#000000" })
    .removeAlpha()
    .png({ compressionLevel: 9 })
    .toFile(dest);
}

async function writeAdaptiveForeground(mark, scale, dest, size) {
  const markSize = Math.round(size * scale);
  const scaledMark = await sharp(mark.data, {
    raw: { width: mark.width, height: mark.height, channels: 4 },
  })
    .resize(markSize, markSize, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  await fs.mkdir(path.dirname(dest), { recursive: true });
  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: scaledMark, gravity: "centre" }])
    .png({ compressionLevel: 9 })
    .toFile(dest);
}

async function writeSplash(dest, width, height, logoSize) {
  const logo = await sharp(splashLogoSrc)
    .resize(logoSize, logoSize, { fit: "contain", background: "#000000" })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width,
      height,
      channels: 3,
      background: "#000000",
    },
  })
    .composite([{ input: logo, gravity: "centre" }])
    .png({ compressionLevel: 9 })
    .toFile(dest);
}

async function copyFile(src, dest) {
  await fs.mkdir(path.dirname(dest), { recursive: true });
  await fs.copyFile(src, dest);
}

async function removeStaleAssets() {
  const stale = [
    path.join(androidRes, "drawable", "splash.png"),
    path.join(androidRes, "mipmap-anydpi-v26", "app_icon.png"),
    ...densities.map(([density]) =>
      path.join(androidRes, `mipmap-${density}`, "app_icon.png"),
    ),
    ...densities.flatMap(([density]) => [
      path.join(androidRes, `drawable-port-${density}`, "splash.png"),
      path.join(androidRes, `drawable-land-${density}`, "splash.png"),
    ]),
  ];

  await Promise.all(stale.map((file) => fs.rm(file, { force: true })));

  // Remove the folders too when the splash PNG was their only file.
  await Promise.all(
    densities.flatMap(([density]) =>
      ["port", "land"].map(async (orientation) => {
        const dir = path.join(androidRes, `drawable-${orientation}-${density}`);
        const entries = await fs.readdir(dir).catch(() => null);
        if (entries && entries.length === 0) await fs.rmdir(dir);
      }),
    ),
  );
}

const iconMark = await loadTransparentMark(iconSrc);

const safeRadiusRatio = (adaptiveSafeZoneDp / 2 / adaptiveLayerDp) * adaptiveSafeZoneMargin;
const adaptiveScale = safeRadiusRatio / maxRadiusRatio(iconMark);

await removeStaleAssets();

await fs.mkdir(path.join(root, "resources"), { recursive: true });
await copyFile(iconSrc, path.join(root, "resources", "icon.png"));
await copyFile(splashLogoSrc, path.join(root, "resources", "splash-logo.png"));
await writeSplash(
  path.join(root, "resources", "splash.png"),
  splashCanvas,
  splashCanvas,
  splashLogoOnCanvas,
);

for (const [density, scale] of densities) {
  const dir = path.join(androidRes, `mipmap-${density}`);
  await fs.mkdir(dir, { recursive: true });

  // Legacy launcher icons (API < 26): full square artwork.
  await writePng(iconSrc, path.join(dir, "ic_launcher.png"), Math.round(48 * scale));
  await writePng(iconSrc, path.join(dir, "ic_launcher_round.png"), Math.round(48 * scale));

  // Adaptive icon layer (API 26+) and its Android 13+ monochrome twin.
  await writeAdaptiveForeground(
    iconMark,
    adaptiveScale,
    path.join(dir, "ic_launcher_foreground.png"),
    Math.round(adaptiveLayerDp * scale),
  );

  // Android 12+ splash icon, also reused by the legacy launch window.
  await writePng(
    splashLogoSrc,
    path.join(dir, "splash_icon.png"),
    Math.round(splashIconDp * scale),
  );
}

const iosIcon = path.join(
  iosAssets,
  "AppIcon.appiconset",
  "AppIcon-512@2x.png",
);
await writePng(iconSrc, iosIcon, 1024);

const iosSplash = path.join(iosAssets, "Splash.imageset");
await writeSplash(
  path.join(iosSplash, "splash-2732x2732.png"),
  splashCanvas,
  splashCanvas,
  splashLogoOnCanvas,
);
await copyFile(
  path.join(iosSplash, "splash-2732x2732.png"),
  path.join(iosSplash, "splash-2732x2732-1.png"),
);
await copyFile(
  path.join(iosSplash, "splash-2732x2732.png"),
  path.join(iosSplash, "splash-2732x2732-2.png"),
);

console.log(
  `Generated native icons (adaptive mark ${(adaptiveScale * 100).toFixed(1)}% of the 108dp layer) and splash assets.`,
);
