import {readFileSync, writeFileSync, mkdirSync, cpSync, rmSync} from 'node:fs';
import {resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = resolve(root, 'dist');
const routes = JSON.parse(readFileSync(resolve(root, 'pages.json'), 'utf8'));
const runtime = readFileSync(resolve(root, 'assets/static-runtime.js'), 'utf8');
const responsiveCss = readFileSync(resolve(root, 'assets/responsive.css'), 'utf8');
const responsiveJs = readFileSync(resolve(root, 'assets/responsive.js'), 'utf8');
const deviceLayout = readFileSync(resolve(root, 'assets/device-layout.js'), 'utf8');
const desktopHeaderCss = readFileSync(resolve(root, 'assets/desktop-header.css'), 'utf8');
const fingerprint = content => createHash('sha256').update(content).digest('hex').slice(0, 12);
const heroAssets = Object.fromEntries(['hero-loop.mp4', 'hero-poster.webp'].map(file => {
  const content = readFileSync(resolve(root, 'assets/media', file));
  const extension = file.slice(file.lastIndexOf('.'));
  return [file, {content, path: `assets/${file.slice(0, -extension.length)}.${fingerprint(content)}${extension}`}];
}));
const heroVideo = heroAssets['hero-loop.mp4'].path;
const heroPoster = heroAssets['hero-poster.webp'].path;
const heroScript = readFileSync(resolve(root, 'assets/hero.js'), 'utf8')
  .replaceAll('__HERO_POSTER__', heroPoster).replaceAll('__HERO_VIDEO__', heroVideo);

function heroPreload() {
  return `<script>(() => {
    const prefix = location.hostname === 'mingyuniverse.github.io' ? '/mingyu-s-website/' : '/';
    const poster = document.createElement('link');
    poster.rel = 'preload'; poster.as = 'image'; poster.fetchPriority = 'high';
    poster.href = prefix + ${JSON.stringify(heroPoster)};
    document.head.append(poster);
  })();</script>`;
}

function adapt(html, mobile) {
  const hasHero = html.includes('id="img_comp-mh5b5hv8"');
  if (hasHero) {
    html = html.replace(/<wow-image\b[^>]*id="img_comp-mh5b5hv8"[^>]*>[\s\S]*?<\/wow-image>/i, element => {
      return element.replace(/(<img\b[^>]*\bsrc=")[^"]*"/, `$1${heroPoster}" fetchpriority="high" loading="eager"`);
    });
    html = html.replace(/<\/head>/i, `${heroPreload()}</head>`);
  }
  html = html.replace(/<head([^>]*)>/i, `$&\n<script>${runtime}</script><script>${heroScript}</script><style>
    #img_comp-mh5b5hv8 > img { visibility: hidden !important; }
    .portfolio-hero-media { position: absolute; inset: 0; pointer-events: none; overflow: hidden; }
    .portfolio-hero-media video { display: block; width: 100%; height: 100%; object-fit: cover; object-position: 50% 50%; opacity: 1; }
  </style>`);
  html = html.replace(/(<script\b[^>]*type="application\/json"[^>]*id="([^"]+)"[^>]*>[\s\S]*?<\/script>)/gi,
    (tag, whole, id) => `${tag}<script>portfolioLocalizeModel(${JSON.stringify(id)})</script>`);
  html = html.replace(/(<script\b[^>]*id="([^"]+)"[^>]*type="application\/json"[^>]*>[\s\S]*?<\/script>)/gi,
    (tag, whole, id) => `${tag}<script>portfolioLocalizeModel(${JSON.stringify(id)})</script>`);
  if (mobile) {
    html = html.replace(/<html\b/i, '<html class="portfolio-responsive"');
    html = html.replace(/(<meta\b[^>]*name="viewport"[^>]*content=")[^"]*/i, '$1width=device-width, initial-scale=1');
    html = html.replace(/<\/head>/i, `<style id="portfolio-responsive-layout">${responsiveCss}</style><script>${responsiveJs}</script></head>`);
  } else {
    html = html.replace(/<html\b/i, '<html class="portfolio-desktop"');
    html = html.replace(/<\/head>/i, `<style id="portfolio-desktop-header">${desktopHeaderCss}</style></head>`);
  }
  return html;
}

function entry(html, route, desktopVersion, responsiveVersion) {
  const title = html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] || 'Mingyu Du Portfolio';
  const description = html.match(/<meta\b[^>]*name="description"[^>]*>/i)?.[0] || '';
  const canonical = 'https://mingyuniverse.com/' + (route ? encodeURI(route) + '/' : '');
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>${description}<link rel="canonical" href="${canonical}">${route === '' ? heroPreload() : ''}
<style>html,body{margin:0;background:#fff;color:#211d38}#page-loading{min-height:100svh;display:grid;place-content:center;text-align:center;font:16px/1.5 system-ui,sans-serif}#page-loading p{margin:8px}#page-loading button{font:inherit;padding:10px 18px}</style>
<script>
${deviceLayout}
(() => {
  const desktop = !portfolioUsesCompactLayout();
  const view = desktop ? 'view-desktop.html?v=${desktopVersion}' : 'view-mobile.html?v=${responsiveVersion}';
  fetch(new URL(view, location.href), {credentials:'same-origin'})
    .then(response => { if (!response.ok) throw new Error('Page unavailable'); return response.text(); })
    .then(html => { document.open(); document.write(html); document.close(); })
    .catch(() => { const status=document.getElementById('page-loading'); if(status) status.innerHTML='<p>Unable to load the portfolio.</p><p><button onclick="location.reload()">Try again</button></p>'; });
})();
</script></head><body><div id="page-loading" role="status"><p>Mingyu Du</p><p>Loading portfolio…</p></div><noscript><a href="view-desktop.html">View portfolio</a></noscript></body></html>`;
}

rmSync(out, {recursive: true, force: true});
mkdirSync(out, {recursive: true});
mkdirSync(resolve(out, 'assets'), {recursive: true});
for (const asset of Object.values(heroAssets)) writeFileSync(resolve(out, asset.path), asset.content);
for (const route of routes) {
  const desktop = readFileSync(resolve(root, 'pages', route, 'index.html'), 'utf8');
  const mobile = readFileSync(resolve(root, 'pages-mobile', route, 'index.html'), 'utf8');
  const directory = resolve(out, route);
  mkdirSync(directory, {recursive: true});
  const desktopDocument = adapt(desktop, false);
  const responsiveDocument = adapt(mobile, true);
  writeFileSync(resolve(directory, 'view-desktop.html'), desktopDocument);
  writeFileSync(resolve(directory, 'view-mobile.html'), responsiveDocument);
  writeFileSync(resolve(directory, 'index.html'), entry(desktop, route, fingerprint(desktopDocument), fingerprint(responsiveDocument)));
}
mkdirSync(resolve(out, 'home'), {recursive: true});
for (const file of ['index.html', 'view-desktop.html', 'view-mobile.html']) cpSync(resolve(out, file), resolve(out, 'home', file));
writeFileSync(resolve(out, 'CNAME'), 'mingyuniverse.com\n');
writeFileSync(resolve(out, '.nojekyll'), '');
console.log(`Built ${routes.length} routes with desktop and phone layouts for GitHub Pages.`);
