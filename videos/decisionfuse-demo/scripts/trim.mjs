// Trims the uniform border from a generated diagram so the video shows the
// drawing, not the canvas margins. Uses ffmpeg and a pixel scan; nothing is
// added to the project's dependencies.
import { spawnSync } from 'node:child_process';

const [src, dest] = process.argv.slice(2);
if (!src || !dest) {
  console.error('usage: node scripts/trim.mjs <src.png> <dest.png>');
  process.exit(1);
}

const run = (cmd, args, encoding = 'utf8') => {
  const result = spawnSync(cmd, args, { encoding, maxBuffer: 1 << 28 });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${cmd} failed: ${String(result.stderr).slice(0, 400)}`);
  return result.stdout;
};

const dims = run('ffprobe', [
  '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', src,
]).trim();
const [width, height] = dims.split(',').map(Number);

const raw = run('ffmpeg', ['-v', 'error', '-i', src, '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], null);
const stride = width * 3;
// The border is whatever colour the top-left pixel is; the diagram is anything
// that differs from it by more than the threshold.
const [br, bg, bb] = [raw[0], raw[1], raw[2]];
const THRESHOLD = 12;

let minX = width;
let minY = height;
let maxX = -1;
let maxY = -1;
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const i = y * stride + x * 3;
    if (Math.abs(raw[i] - br) + Math.abs(raw[i + 1] - bg) + Math.abs(raw[i + 2] - bb) <= THRESHOLD) continue;
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
}

if (maxX < 0) {
  console.error('no content found; leaving the image untouched');
  process.exit(1);
}

const pad = 24;
const w = Math.min(width - minX, maxX - minX + 1 + pad * 2);
const h = Math.min(height - minY, maxY - minY + 1 + pad * 2);
const x = Math.max(0, minX - pad);
const y = Math.max(0, minY - pad);

run('ffmpeg', [
  '-y', '-v', 'error', '-i', src,
  '-vf', `crop=${w - (w % 2)}:${h - (h % 2)}:${x}:${y}`, dest,
]);
const out = run('ffprobe', [
  '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', dest,
]).trim();
console.log(`${src} ${width}x${height} -> ${dest} ${out.replace(',', 'x')}`);
