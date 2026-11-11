import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import {resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import {canonicalFor, googleVerification} from './seo.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const routes = JSON.parse(readFileSync(resolve(root, 'pages.json'), 'utf8'));
const runtime = readFileSync(resolve(root, 'assets/static-runtime.js'), 'utf8');
new vm.Script(runtime);
new vm.Script(readFileSync(resolve(root, 'assets/responsive.js'), 'utf8'));
new vm.Script(readFileSync(resolve(root, 'assets/hero.js'), 'utf8'));
new vm.Script(readFileSync(resolve(root, 'assets/seo.js'), 'utf8'));
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
  assert.ok(entry.includes(`<link rel="canonical" href="${canonicalFor(route)}">`), route);
  assert.ok(entry.includes(`<meta name="google-site-verification" content="${googleVerification}">`), route);
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
    assert.equal(html.includes('id="portfolio-desktop-header"'), expected === 'desktop', route);
    const canonicalLinks = html.match(/<link\b[^>]*rel="canonical"[^>]*>/g);
    assert.deepEqual(canonicalLinks, [`<link rel="canonical" href="${canonicalFor(route)}">`], route);
    assert.ok(!/<meta\b[^>]*(?:og:url|og:site_name)[^>]*content="[^"]*(?:dumingyuyuyu|Dumingyuyuyu)/.test(html), route);
    assert.ok(!html.includes("matchMedia('(min-width: 1640px)')"), route);
    if (expected === 'mobile') assert.ok(html.includes('width=device-width, initial-scale=1'), route);
  }
}
assert.equal(readFileSync(resolve(root, 'dist/CNAME'), 'utf8').trim(), 'mingyuniverse.com');
assert.ok(existsSync(resolve(root, 'dist/.nojekyll')));
assert.ok(existsSync(resolve(root, 'dist/home/index.html')));
assert.ok(readFileSync(resolve(root, 'dist/robots.txt'), 'utf8').includes('Sitemap: https://mingyuniverse.com/sitemap.xml'));
const sitemap = readFileSync(resolve(root, 'dist/sitemap.xml'), 'utf8');
for (const route of routes.filter(route => !['blank', 'fullscreen-page'].includes(route))) assert.ok(sitemap.includes(`<loc>${canonicalFor(route)}</loc>`), route);
assert.ok(readFileSync(resolve(root, 'dist/index.html'), 'utf8').includes('<title>Mingyuniverse |'));
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

// Local project media must ship with both layouts and resolve from nested routes.
const projectPages = [
  ['not', 'nothing-video', 4, 0],
  ['weverse', 'room-design-video', 1, 3],
  ['13reasons-why', 'thirteen-reasons-video', 4, 0],
  ['butter', null, 0, 4],
  ['blank', null, 0, 4],
  ['apple-music', 'apple-music-video', 1, 15],
  ['1984', 'mome729-video', 1, 0],
  ['towriteloveonherarms', 'mome729-video', 1, 0],
  ['portfolio-collections/motion-media-design/project-title-4', 'amtrak-video', 2, 14],
];
for (const [route, videoClass, videos, images] of projectPages) {
  for (const layout of ['desktop', 'mobile']) {
    const directory = resolve(root, 'dist', route);
    const html = readFileSync(resolve(directory, `view-${layout}.html`), 'utf8');
    const videoTags = [...html.matchAll(/<video\b[^>]*>/g)].filter(([tag]) => tag.includes(`class="${videoClass}"`));
    assert.equal(videoTags.length, videos, `${route}: video slots (${layout})`);
    assert.equal([...html.matchAll(/<img src="(?:\.\.\/)+assets\//g)].length, images, `${route}: image slots (${layout})`);
    for (const [, reference] of html.matchAll(/(?:src|poster)="((?:\.\.\/)+assets\/[^"]+)"/g)) {
      const path = resolve(directory, reference);
      assert.ok(existsSync(path), `Missing media: ${route}/${reference}`);
      const expected = reference.match(/\.([a-f0-9]{12})\.[a-z0-9]+$/)?.[1];
      assert.equal(createHash('sha256').update(readFileSync(path)).digest('hex').slice(0, 12), expected, path);
    }
    if (route === 'apple-music') {
      const gallery = html.match(/<div class="apple-music-sketches"[^>]*>([\s\S]*?)<\/div>/)?.[1];
      assert.deepEqual([...gallery.matchAll(/alt="Apple Music sketch (\d+)"/g)].map(match => match[1]), ['1','2','3','4','5','6','7','8']);
    }
  }
}
console.log('Verified all updated project media, cache fingerprints, nested paths, and sketch order.');
