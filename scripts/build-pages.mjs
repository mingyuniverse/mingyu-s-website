import {readFileSync, writeFileSync, mkdirSync, cpSync, rmSync} from 'node:fs';
import {resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = resolve(root, 'dist');
const routes = JSON.parse(readFileSync(resolve(root, 'pages.json'), 'utf8'));
const runtime = readFileSync(resolve(root, 'assets/static-runtime.js'), 'utf8');
const phoneCss = readFileSync(resolve(root, 'assets/phone.css'), 'utf8');
const phoneJs = readFileSync(resolve(root, 'assets/phone.js'), 'utf8');

function adapt(html, mobile) {
  html = html.replace(/<head([^>]*)>/i, `$&\n<script>${runtime}</script>`);
  html = html.replace(/(<script\b[^>]*type="application\/json"[^>]*id="([^"]+)"[^>]*>[\s\S]*?<\/script>)/gi,
    (tag, whole, id) => `${tag}<script>portfolioLocalizeModel(${JSON.stringify(id)})</script>`);
  html = html.replace(/(<script\b[^>]*id="([^"]+)"[^>]*type="application\/json"[^>]*>[\s\S]*?<\/script>)/gi,
    (tag, whole, id) => `${tag}<script>portfolioLocalizeModel(${JSON.stringify(id)})</script>`);
  if (mobile) {
    html = html.replace(/<html\b/i, '<html class="portfolio-phone"');
    html = html.replace(/(<meta\b[^>]*name="viewport"[^>]*content=")[^"]*/i, '$1width=device-width, initial-scale=1');
    html = html.replace(/<\/head>/i, `<style id="portfolio-phone-layout">${phoneCss}</style><script>${phoneJs}</script></head>`);
  }
  return html;
}

function entry(html, route) {
  const title = html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] || 'Mingyu Du Portfolio';
  const description = html.match(/<meta\b[^>]*name="description"[^>]*>/i)?.[0] || '';
  const canonical = 'https://mingyuniverse.com/' + (route ? encodeURI(route) + '/' : '');
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>${description}<link rel="canonical" href="${canonical}">
<style>html,body{margin:0;background:#fff;color:#211d38}#page-loading{min-height:100svh;display:grid;place-content:center;text-align:center;font:16px/1.5 system-ui,sans-serif}#page-loading p{margin:8px}#page-loading button{font:inherit;padding:10px 18px}</style>
<script>
(() => {
  const phone = matchMedia('(max-width: 1023px)').matches;
  const view = phone ? 'view-mobile.html' : 'view-desktop.html';
  fetch(new URL(view, location.href), {credentials:'same-origin'})
    .then(response => { if (!response.ok) throw new Error('Page unavailable'); return response.text(); })
    .then(html => { document.open(); document.write(html); document.close(); })
    .catch(() => { const status=document.getElementById('page-loading'); if(status) status.innerHTML='<p>Unable to load the portfolio.</p><p><button onclick="location.reload()">Try again</button></p>'; });
})();
</script></head><body><div id="page-loading" role="status"><p>Mingyu Du</p><p>Loading portfolio…</p></div><noscript><a href="view-desktop.html">View portfolio</a></noscript></body></html>`;
}

rmSync(out, {recursive: true, force: true});
mkdirSync(out, {recursive: true});
for (const route of routes) {
  const desktop = readFileSync(resolve(root, 'pages', route, 'index.html'), 'utf8');
  const mobile = readFileSync(resolve(root, 'pages-mobile', route, 'index.html'), 'utf8');
  const directory = resolve(out, route);
  mkdirSync(directory, {recursive: true});
  writeFileSync(resolve(directory, 'view-desktop.html'), adapt(desktop, false));
  writeFileSync(resolve(directory, 'view-mobile.html'), adapt(mobile, true));
  writeFileSync(resolve(directory, 'index.html'), entry(desktop, route));
}
mkdirSync(resolve(out, 'home'), {recursive: true});
for (const file of ['index.html', 'view-desktop.html', 'view-mobile.html']) cpSync(resolve(out, file), resolve(out, 'home', file));
writeFileSync(resolve(out, 'CNAME'), 'mingyuniverse.com\n');
writeFileSync(resolve(out, '.nojekyll'), '');
console.log(`Built ${routes.length} routes with desktop and phone layouts for GitHub Pages.`);
