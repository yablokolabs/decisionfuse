// Render preview stills at given seconds, plus a tiled contact sheet, so the
// frames can be reviewed before a full render.
//
//   node scripts/stills.mjs <batch-name> <sec> [sec...]
//   node scripts/stills.mjs b1 3 12.5 20
//
// Output: stills/<batch>/s_<sec>.jpg and stills/<batch>/sheet.jpg (needs ffmpeg).
// Each batch gets its own folder so nothing has to be deleted between runs.
import {bundle} from '@remotion/bundler';
import {getCompositions, renderStill, selectComposition} from '@remotion/renderer';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const [batch, ...rest] = process.argv.slice(2);
const secs = rest.map(Number).filter((n) => !Number.isNaN(n));
if (!batch || secs.length === 0) {
  console.error('usage: node scripts/stills.mjs <batch-name> <sec> [sec...]');
  process.exit(1);
}

const findBrowser = () => {
  if (process.env.REMOTION_BROWSER && fs.existsSync(process.env.REMOTION_BROWSER)) return process.env.REMOTION_BROWSER;
  const root = '/opt/pw-browsers';
  if (!fs.existsSync(root)) return undefined;
  for (const dir of fs.readdirSync(root).filter((d) => d.startsWith('chromium_headless_shell')).sort().reverse()) {
    const p = path.join(root, dir, 'chrome-headless-shell-linux64', 'chrome-headless-shell');
    if (fs.existsSync(p)) return p;
  }
  return undefined;
};

const browserExecutable = findBrowser();
const outDir = path.join('stills', batch);
fs.mkdirSync(outDir, {recursive: true});
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const compositions = await getCompositions(serveUrl, {browserExecutable});
const id = process.env.COMPOSITION ?? compositions[0].id;
const composition = await selectComposition({serveUrl, id, browserExecutable});
const files = [];
for (const s of secs) {
  const file = path.join(outDir, `s_${s.toFixed(1).padStart(6, '0')}.jpg`);
  await renderStill({composition, serveUrl, frame: Math.min(composition.durationInFrames - 1, Math.round(s * composition.fps)), output: file, imageFormat: 'jpeg', jpegQuality: 80, browserExecutable, scale: 0.5});
  files.push(file);
  console.log('still', s, '->', file);
}
if (files.length > 1) {
  try {
    const cols = 2;
    const rows = Math.ceil(files.length / cols);
    execFileSync('ffmpeg', [
      '-v', 'error', '-y',
      '-pattern_type', 'glob', '-i', path.join(outDir, 's_*.jpg'),
      '-vf', `tile=${cols}x${rows}:padding=4`,
      '-frames:v', '1',
      path.join(outDir, 'sheet.jpg'),
    ]);
    console.log('sheet ->', path.join(outDir, 'sheet.jpg'));
  } catch (e) {
    console.log('(contact sheet skipped:', String(e.message).split('\n')[0], ')');
  }
}
