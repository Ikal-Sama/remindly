import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const iconSrc = path.join(root, "public", "R-app-icon-1024.png");
const splashLogoSrc = path.join(root, "public", "R-splash-logo-1024.png");
const splashCanvas = 2732;
const splashLogoOnCanvas = 1024;

const launcher = [
  ["mipmap-mdpi", 48],
  ["mipmap-hdpi", 72],
  ["mipmap-xhdpi", 96],
  ["mipmap-xxhdpi", 144],
  ["mipmap-xxxhdpi", 192],
];

const adaptiveForeground = [
  ["mipmap-mdpi", 108],
  ["mipmap-hdpi", 162],
  ["mipmap-xhdpi", 216],
  ["mipmap-xxhdpi", 324],
  ["mipmap-xxxhdpi", 432],
];

const splashIcon = [
  ["mipmap-mdpi", 240],
  ["mipmap-hdpi", 360],
  ["mipmap-xhdpi", 480],
  ["mipmap-xxhdpi", 720],
  ["mipmap-xxxhdpi", 960],
];

const splashPort = [
  ["drawable-port-mdpi", 320, 480],
  ["drawable-port-hdpi", 480, 800],
  ["drawable-port-xhdpi", 720, 1280],
  ["drawable-port-xxhdpi", 960, 1600],
  ["drawable-port-xxxhdpi", 1280, 1920],
];

const splashLand = [
  ["drawable-land-mdpi", 480, 320],
  ["drawable-land-hdpi", 800, 480],
  ["drawable-land-xhdpi", 1280, 720],
  ["drawable-land-xxhdpi", 1600, 960],
  ["drawable-land-xxxhdpi", 1920, 1280],
];

async function writePng(src, dest, size) {
  await sharp(src)
    .resize(size, size, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 1 },
    })
    .png()
    .toFile(dest);
}

async function writeSplash(dest, width, height) {
  const logoSize = Math.round(
    Math.min(width, height) * (splashLogoOnCanvas / splashCanvas),
  );
  const logo = await sharp(splashLogoSrc)
    .resize(logoSize, logoSize, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 1 },
    })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 1 },
    },
  })
    .composite([{ input: logo, gravity: "centre" }])
    .png()
    .toFile(dest);
}

async function copyFile(src, dest) {
  await fs.mkdir(path.dirname(dest), { recursive: true });
  await fs.copyFile(src, dest);
}

const androidRes = path.join(root, "android", "app", "src", "main", "res");

await fs.mkdir(path.join(root, "resources", "icons"), { recursive: true });
await copyFile(iconSrc, path.join(root, "resources", "icon.png"));
await copyFile(iconSrc, path.join(root, "resources", "icons", "app-icon.png"));
await copyFile(splashLogoSrc, path.join(root, "resources", "splash-logo.png"));
await writeSplash(path.join(root, "resources", "splash.png"), splashCanvas, splashCanvas);

for (const [folder, size] of launcher) {
  const dir = path.join(androidRes, folder);
  await fs.mkdir(dir, { recursive: true });
  await writePng(iconSrc, path.join(dir, "ic_launcher.png"), size);
  await writePng(iconSrc, path.join(dir, "ic_launcher_round.png"), size);
  await writePng(iconSrc, path.join(dir, "app_icon.png"), size);
}

for (const [folder, size] of adaptiveForeground) {
  const dir = path.join(androidRes, folder);
  await fs.mkdir(dir, { recursive: true });
  await writePng(iconSrc, path.join(dir, "ic_launcher_foreground.png"), size);
}

for (const [folder, size] of splashIcon) {
  const dir = path.join(androidRes, folder);
  await fs.mkdir(dir, { recursive: true });
  await writePng(splashLogoSrc, path.join(dir, "splash_icon.png"), size);
}

for (const [folder, width, height] of [...splashPort, ...splashLand]) {
  const dir = path.join(androidRes, folder);
  await fs.mkdir(dir, { recursive: true });
  await writeSplash(path.join(dir, "splash.png"), width, height);
}

await writeSplash(path.join(androidRes, "drawable", "splash.png"), 1280, 1920);

try {
  await fs.unlink(path.join(androidRes, "mipmap-anydpi-v26", "app_icon.png"));
} catch {
  // already absent
}

const iosIcon = path.join(
  root,
  "ios",
  "App",
  "App",
  "Assets.xcassets",
  "AppIcon.appiconset",
  "AppIcon-512@2x.png",
);
await writePng(iconSrc, iosIcon, 1024);

const iosSplashDir = path.join(
  root,
  "ios",
  "App",
  "App",
  "Assets.xcassets",
  "Splash.imageset",
);
await writeSplash(path.join(iosSplashDir, "splash-2732x2732.png"), splashCanvas, splashCanvas);
await writeSplash(path.join(iosSplashDir, "splash-2732x2732-1.png"), splashCanvas, splashCanvas);
await writeSplash(path.join(iosSplashDir, "splash-2732x2732-2.png"), splashCanvas, splashCanvas);

console.log("Generated native icon and splash assets.");
