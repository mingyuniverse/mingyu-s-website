import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import {resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const routes = JSON.parse(readFileSync(resolve(root, 'pages.json'), 'utf8'));
const runtime = readFileSync(resolve(root, 'assets/static-runtime.js'), 'utf8');
new vm.Script(runtime);
for (const route of routes) {
  const html = readFileSync(resolve(root, 'dist', route, 'index.html'), 'utf8');
  assert.ok(html.startsWith('<!DOCTYPE html>'));
  assert.ok(html.includes('portfolioLocalizeModel("wix-essential-viewer-model")'), route);
  assert.ok(html.includes('portfolioLocalizeModel("wix-viewer-model")'), route);
  assert.ok(html.includes('installFetchBridge'), route);
  assert.ok(html.includes('importScripts('), route);
}
assert.equal(readFileSync(resolve(root, 'dist/CNAME'), 'utf8').trim(), 'mingyuniverse.com');
assert.ok(existsSync(resolve(root, 'dist/.nojekyll')));
assert.ok(existsSync(resolve(root, 'dist/home/index.html')));
console.log(`Verified ${routes.length} static routes, runtime adapter, home alias, and custom domain.`);
