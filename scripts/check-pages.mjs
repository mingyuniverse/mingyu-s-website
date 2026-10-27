import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import {resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const routes = JSON.parse(readFileSync(resolve(root, 'pages.json'), 'utf8'));
const runtime = readFileSync(resolve(root, 'assets/static-runtime.js'), 'utf8');
new vm.Script(runtime);
new vm.Script(readFileSync(resolve(root, 'assets/responsive.js'), 'utf8'));
for (const route of routes) {
  const entry = readFileSync(resolve(root, 'dist', route, 'index.html'), 'utf8');
  assert.ok(entry.startsWith('<!DOCTYPE html>'));
  assert.ok(entry.includes('view-mobile.html') && entry.includes('view-desktop.html'), route);
  assert.ok(entry.includes("matchMedia('(min-width: 1640px)')"), route);
  for (const [file, expected] of [['view-desktop.html', 'desktop'], ['view-mobile.html', 'mobile']]) {
    const html = readFileSync(resolve(root, 'dist', route, file), 'utf8');
    assert.ok(html.includes('portfolioLocalizeModel("wix-essential-viewer-model")'), route);
    assert.ok(html.includes('portfolioLocalizeModel("wix-viewer-model")'), route);
    assert.ok(html.includes('installFetchBridge'), route);
    assert.ok(html.includes('importScripts('), route);
    const model = JSON.parse(html.match(/<script[^>]+id="wix-viewer-model"[^>]*>([\s\S]*?)<\/script>/)[1]);
    assert.equal(model.formFactor, expected, route);
    assert.equal(html.includes('id="portfolio-responsive-layout"'), expected === 'mobile', route);
    assert.ok(html.includes("matchMedia('(min-width: 1640px)')"), route);
    if (expected === 'mobile') assert.ok(html.includes('width=device-width, initial-scale=1'), route);
  }
}
assert.equal(readFileSync(resolve(root, 'dist/CNAME'), 'utf8').trim(), 'mingyuniverse.com');
assert.ok(existsSync(resolve(root, 'dist/.nojekyll')));
assert.ok(existsSync(resolve(root, 'dist/home/index.html')));
console.log(`Verified ${routes.length} routes with matching desktop/phone documents, runtime adapters, and custom domain.`);
