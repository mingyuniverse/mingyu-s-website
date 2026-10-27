import {readFileSync, writeFileSync, mkdirSync, cpSync} from 'node:fs';
import {gzipSync} from 'node:zlib';
import {resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const routes = JSON.parse(readFileSync(resolve(root, 'pages.json'), 'utf8'));
const snapshots = Object.fromEntries(routes.map(route => {
  const html = readFileSync(resolve(root, 'pages', route, 'index.html'));
  return [route ? '/' + route : '/', gzipSync(html, {level: 9}).toString('base64')];
}));
const template = readFileSync(resolve(root, 'worker/index.js'), 'utf8');
const output = template.replace('__SNAPSHOTS__', JSON.stringify(snapshots));
mkdirSync(resolve(root, 'dist/server'), {recursive: true});
mkdirSync(resolve(root, 'dist/.openai'), {recursive: true});
writeFileSync(resolve(root, 'dist/server/index.js'), output);
cpSync(resolve(root, '.openai/hosting.json'), resolve(root, 'dist/.openai/hosting.json'));
console.log(`Built ${routes.length} pages; Worker ${(Buffer.byteLength(output) / 1024 / 1024).toFixed(2)} MB.`);
