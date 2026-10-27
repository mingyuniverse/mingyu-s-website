import {readFileSync, writeFileSync, mkdirSync, cpSync, rmSync} from 'node:fs';
import {resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = resolve(root, 'dist');
const routes = JSON.parse(readFileSync(resolve(root, 'pages.json'), 'utf8'));
const runtime = readFileSync(resolve(root, 'assets/static-runtime.js'), 'utf8');
rmSync(out, {recursive: true, force: true});
mkdirSync(out, {recursive: true});
for (const route of routes) {
  let html = readFileSync(resolve(root, 'pages', route, 'index.html'), 'utf8');
  html = html.replace(/<head([^>]*)>/i, `$&\n<script>${runtime}</script>`);
  // Localize embedded viewer models synchronously before the following Wix
  // bootstrap script reads them. Their contents remain valid JSON.
  html = html.replace(/(<script\b[^>]*type="application\/json"[^>]*id="([^"]+)"[^>]*>[\s\S]*?<\/script>)/gi,
    (tag, whole, id) => `${tag}<script>portfolioLocalizeModel(${JSON.stringify(id)})</script>`);
  html = html.replace(/(<script\b[^>]*id="([^"]+)"[^>]*type="application\/json"[^>]*>[\s\S]*?<\/script>)/gi,
    (tag, whole, id) => `${tag}<script>portfolioLocalizeModel(${JSON.stringify(id)})</script>`);
  const dest = resolve(out, route, 'index.html');
  mkdirSync(dirname(dest), {recursive: true});
  writeFileSync(dest, html);
}
mkdirSync(resolve(out, 'home'), {recursive: true});
cpSync(resolve(out, 'index.html'), resolve(out, 'home/index.html'));
writeFileSync(resolve(out, 'CNAME'), 'mingyuniverse.com\n');
writeFileSync(resolve(out, '.nojekyll'), '');
console.log(`Built ${routes.length} static pages for GitHub Pages.`);
