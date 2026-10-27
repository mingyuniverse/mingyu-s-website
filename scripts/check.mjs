import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve, dirname} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const routes = JSON.parse(readFileSync(resolve(root, 'pages.json'), 'utf8'));
const {default: worker} = await import(pathToFileURL(resolve(root, 'dist/server/index.js')));
for (const route of routes) {
  const path = route ? '/' + route : '/';
  const response = await worker.fetch(new Request('https://replica.example' + encodeURI(path)));
  assert.equal(response.status, 200, path);
  const html = await response.text();
  assert.ok(html.startsWith('<!DOCTYPE html>'), `${path}: missing document`);
  assert.ok(html.includes('https://replica.example'), `${path}: internal URLs not localized`);
  assert.ok(!html.includes('https://www.dumingyuyuyu.com'), `${path}: original navigation origin remains`);
  assert.ok(!html.includes('https:\\/\\/www.dumingyuyuyu.com'), `${path}: original runtime origin remains`);
  assert.ok(html.includes('wix-viewer-model'), `${path}: animation runtime configuration missing`);
}
assert.equal((await worker.fetch(new Request('https://replica.example/missing'))).status, 404);
assert.equal((await worker.fetch(new Request('https://replica.example/', {method:'POST'}))).status, 405);
assert.equal((await worker.fetch(new Request('https://replica.example/home'))).status, 200);
const realFetch = globalThis.fetch;
let forwarded;
globalThis.fetch = async (url, options) => {
  forwarded = {url, options};
  return new Response(JSON.stringify({url:'https://www.dumingyuyuyu.com/about'}), {headers:{'Content-Type':'application/json'}});
};
try {
  const response = await worker.fetch(new Request('https://replica.example/_serverless/portfolio-router/pages?viewMode=site', {
    method:'POST', headers:{'Content-Type':'application/json', Cookie:'private=test', Authorization:'private-test'}, body:'{"path":"/selected-work"}'
  }));
  assert.equal(response.status, 200);
  assert.equal(forwarded.options.method, 'POST');
  assert.equal(forwarded.options.body, '{"path":"/selected-work"}');
  assert.ok(!forwarded.options.headers.Cookie && !forwarded.options.headers.Authorization);
  assert.equal((await response.json()).url, 'https://replica.example/about');
} finally { globalThis.fetch = realFetch; }
console.log(`Verified all ${routes.length} routes, original runtime configuration, internal navigation, and request boundaries.`);
