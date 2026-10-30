import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import {resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
import {createHash} from 'node:crypto';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const routes = JSON.parse(readFileSync(resolve(root, 'pages.json'), 'utf8'));
const runtime = readFileSync(resolve(root, 'assets/static-runtime.js'), 'utf8');
new vm.Script(runtime);
new vm.Script(readFileSync(resolve(root, 'assets/responsive.js'), 'utf8'));
new vm.Script(readFileSync(resolve(root, 'assets/hero.js'), 'utf8'));
const deviceLayout = readFileSync(resolve(root, 'assets/device-layout.js'), 'utf8');
for (const [navigator, compact] of [
  [{userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X)', platform: 'MacIntel', maxTouchPoints: 0}, false],
  [{userAgent: 'Mozilla/5.0 (Windows NT 10.0)', platform: 'Win32', maxTouchPoints: 10}, false],
  [{userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0)', platform: 'iPhone', maxTouchPoints: 5}, true],
  [{userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X)', platform: 'MacIntel', maxTouchPoints: 5}, true],
  [{userAgent: 'Mozilla/5.0 (Linux; Android 15)', platform: 'Linux armv8l', maxTouchPoints: 5}, true]
]) {
  assert.equal(vm.runInNewContext(`${deviceLayout}\nportfolioUsesCompactLayout()`, {navigator}), compact);
}
for (const route of routes) {
  const entry = readFileSync(resolve(root, 'dist', route, 'index.html'), 'utf8');
  assert.ok(entry.startsWith('<!DOCTYPE html>'));
  assert.ok(entry.includes('view-mobile.html') && entry.includes('view-desktop.html'), route);
  assert.ok(entry.includes('const desktop = !portfolioUsesCompactLayout()'), route);
  for (const [file, expected] of [['view-desktop.html', 'desktop'], ['view-mobile.html', 'mobile']]) {
    const html = readFileSync(resolve(root, 'dist', route, file), 'utf8');
    const version = createHash('sha256').update(html).digest('hex').slice(0, 12);
    assert.ok(entry.includes(`${file}?v=${version}`), `Stale document version: ${route}/${file}`);
    assert.ok(html.includes('portfolioLocalizeModel("wix-essential-viewer-model")'), route);
    assert.ok(html.includes('portfolioLocalizeModel("wix-viewer-model")'), route);
    assert.ok(html.includes('installFetchBridge'), route);
    assert.ok(html.includes('importScripts('), route);
    const model = JSON.parse(html.match(/<script[^>]+id="wix-viewer-model"[^>]*>([\s\S]*?)<\/script>/)[1]);
    assert.equal(model.formFactor, expected, route);
    assert.equal(html.includes('id="portfolio-responsive-layout"'), expected === 'mobile', route);
    assert.ok(!html.includes("matchMedia('(min-width: 1640px)')"), route);
    if (expected === 'mobile') assert.ok(html.includes('width=device-width, initial-scale=1'), route);
  }
}
assert.equal(readFileSync(resolve(root, 'dist/CNAME'), 'utf8').trim(), 'mingyuniverse.com');
assert.ok(existsSync(resolve(root, 'dist/.nojekyll')));
assert.ok(existsSync(resolve(root, 'dist/home/index.html')));
for (const file of ['view-desktop.html', 'view-mobile.html']) {
  const home = readFileSync(resolve(root, 'dist', file), 'utf8');
  const poster = home.match(/<wow-image\b[^>]*id="img_comp-mh5b5hv8"[^>]*>[\s\S]*?<img\b[^>]*src="([^"]+)"/)[1];
  assert.match(poster, /^assets\/hero-poster\.[a-f0-9]+\.webp$/);
  assert.ok(existsSync(resolve(root, 'dist', poster)));
  const video = home.match(/assets\/hero-loop\.[a-f0-9]+\.mp4/)[0];
  const bytes = readFileSync(resolve(root, 'dist', video));
  assert.ok(bytes.length < 1024 * 1024, 'Keep the opening animation below 1 MB');
  assert.ok(bytes.indexOf('moov') < bytes.indexOf('mdat'), 'MP4 must support fast startup');
}
console.log(`Verified ${routes.length} routes with matching desktop/phone documents, runtime adapters, and custom domain.`);
