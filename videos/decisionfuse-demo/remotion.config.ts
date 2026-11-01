import {Config} from '@remotion/cli/config';
import fs from 'node:fs';
import path from 'node:path';

Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(92);
Config.setCodec('h264');
Config.setCrf(16);

// Remotion normally downloads its own headless Chrome. In sandboxes where that
// download is blocked, reuse a local one: $REMOTION_BROWSER, or a Playwright
// chrome-headless-shell under /opt/pw-browsers.
const findBrowser = (): string | null => {
  if (process.env.REMOTION_BROWSER && fs.existsSync(process.env.REMOTION_BROWSER)) return process.env.REMOTION_BROWSER;
  const root = '/opt/pw-browsers';
  if (!fs.existsSync(root)) return null;
  for (const dir of fs.readdirSync(root).filter((d) => d.startsWith('chromium_headless_shell')).sort().reverse()) {
    const p = path.join(root, dir, 'chrome-headless-shell-linux64', 'chrome-headless-shell');
    if (fs.existsSync(p)) return p;
  }
  return null;
};
const browser = findBrowser();
if (browser) Config.setBrowserExecutable(browser);
