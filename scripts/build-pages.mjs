import {readFileSync, writeFileSync, mkdirSync, cpSync, rmSync} from 'node:fs';
import {resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {applySeo, canonicalFor, siteOrigin} from './seo.mjs';
import {applyBiography, biographyScript} from './biography.mjs';
import {applyNothingVideos, nothingVideos} from './nothing-videos.mjs';
import {applyRoomDesign, roomFiles} from './room-design.mjs';
import {applyThirteenReasons, thirteenFiles} from './thirteen-reasons.mjs';
import {applyStillLife, stillLifeFiles} from './still-life.mjs';
import {applyAppleMusic, appleMusicFiles} from './apple-music.mjs';
import {applyMome729Video, mome729Files} from './mome729-videos.mjs';
import {applyAmtrak, amtrakFiles, amtrakRoute} from './amtrak.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = resolve(root, 'dist');
const routes = JSON.parse(readFileSync(resolve(root, 'pages.json'), 'utf8'));
const runtime = readFileSync(resolve(root, 'assets/static-runtime.js'), 'utf8');
const responsiveCss = readFileSync(resolve(root, 'assets/responsive.css'), 'utf8');
const responsiveJs = readFileSync(resolve(root, 'assets/responsive.js'), 'utf8');
const deviceLayout = readFileSync(resolve(root, 'assets/device-layout.js'), 'utf8');
const desktopHeaderCss = readFileSync(resolve(root, 'assets/desktop-header.css'), 'utf8');
const seoScript = readFileSync(resolve(root, 'assets/seo.js'), 'utf8');
const fingerprint = content => createHash('sha256').update(content).digest('hex').slice(0, 12);
const amtrakAssets = Object.fromEntries(amtrakFiles.map(file => {
  const content = readFileSync(resolve(root, 'assets/projects/amtrak', file));
  return [file, {content, path: `assets/amtrak/${file.slice(0, -4).replaceAll(' ', '-')}.${fingerprint(content)}${file.slice(-4)}`}];
}));
const amtrakPaths = Object.fromEntries(Object.entries(amtrakAssets).map(([file, asset]) => [file, asset.path]));
// These older Wix routes were captured with the Amtrak body under other project titles.
const projectAliases = new Map([
  ['portfolio-collections/motion-media-design/apple-music', 'apple-music'],
  ['portfolio-collections/motion-media-design/project-title-2', '1984'],
  ['portfolio-collections/motion-media-design/project-title-6', 'towriteloveonherarms'],
]);
const mome729Assets = Object.fromEntries(mome729Files.map(file => {
  const content = readFileSync(resolve(root, 'assets/projects/mome729', file));
  return [file, {content, path: `assets/mome729/${file.slice(0, -4)}.${fingerprint(content)}${file.slice(-4)}`}];
}));
const mome729Paths = Object.fromEntries(Object.entries(mome729Assets).map(([file, asset]) => [file, asset.path]));
const appleMusicAssets = Object.fromEntries(appleMusicFiles.map(file => {
  const content = readFileSync(resolve(root, 'assets/projects/apple-music', file));
  return [file, {content, path: `assets/apple-music/${file.slice(0, -4)}.${fingerprint(content)}${file.slice(-4)}`}];
}));
const stillLifeAssets = Object.fromEntries(stillLifeFiles.map(file => {
  const content = readFileSync(resolve(root, 'assets/projects/still-life', file));
  return [file, {content, path: `assets/still-life/${file.slice(0, -4)}.${fingerprint(content)}${file.slice(-4)}`}];
}));
const nothingAssets = Object.fromEntries(Object.values(nothingVideos).map(file => {
  const content = readFileSync(resolve(root, 'assets/projects/nothing', file));
  return [file, {content, path: `assets/nothing/${file.slice(0, -4)}.${fingerprint(content)}.mp4`}];
}));
const roomAssets = Object.fromEntries(roomFiles.map(file => {
  const content = readFileSync(resolve(root, 'assets/projects/room-design', file));
  return [file, {content, path: `assets/room-design/${file.slice(0, -4)}.${fingerprint(content)}${file.slice(-4)}`}];
}));
const thirteenAssets = Object.fromEntries(thirteenFiles.map(file => {
  const content = readFileSync(resolve(root, 'assets/projects/13-reasons-why', file));
  return [file, {content, path: `assets/13-reasons-why/${file.slice(0, -4)}.${fingerprint(content)}${file.slice(-4)}`}];
}));
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

function adapt(html, mobile, route) {
  if (route === amtrakRoute) html = applyAmtrak(html, amtrakPaths);
  html = applyMome729Video(html, mome729Paths, route);
  if (route === 'apple-music') {
    html = applyAppleMusic(html, Object.fromEntries(Object.entries(appleMusicAssets).map(([file, asset]) => [file, asset.path])));
  }
  if (route === 'butter' || route === 'blank') {
    html = applyStillLife(html, Object.fromEntries(Object.entries(stillLifeAssets).map(([file, asset]) => [file, asset.path])));
  }
  if (route === 'not') {
    html = applyNothingVideos(html, Object.fromEntries(Object.entries(nothingAssets).map(([file, asset]) => [file, asset.path])));
  }
  if (route === 'weverse') {
    html = applyRoomDesign(html, Object.fromEntries(Object.entries(roomAssets).map(([file, asset]) => [file, asset.path])));
  }
  if (route === '13reasons-why') {
    html = applyThirteenReasons(html, Object.fromEntries(Object.entries(thirteenAssets).map(([file, asset]) => [file, asset.path])));
  }
  if (html.includes('id="comp-mh5d44jq"')) {
    html = applyBiography(html).replace(/<\/head>/i, `<script>${biographyScript}</script></head>`);
  }
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
  html = applySeo(html, route);
  return html.replace(/<\/head>/i, `<script>${seoScript}</script></head>`);
}

function entry(html, route, desktopVersion, responsiveVersion) {
  const alias = projectAliases.get(route);
  const title = html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] || 'Mingyu Du Portfolio';
  const description = html.match(/<meta\b[^>]*name="description"[^>]*>/i)?.[0] || '';
  const canonical = 'https://mingyuniverse.com/' + (route ? encodeURI(route) + '/' : '');
  const verification = html.match(/<meta\b[^>]*name="google-site-verification"[^>]*>/i)?.[0] || '';
  const structuredData = route ? '' : html.match(/<script\b[^>]*type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>/gi)?.join('') || '';
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>${description}${verification}${structuredData}<meta property="og:site_name" content="Mingyuniverse"><link rel="canonical" href="${canonical}">${route === '' ? heroPreload() : ''}
<style>html,body{margin:0;background:#fff;color:#211d38}#page-loading{min-height:100svh;display:grid;place-content:center;text-align:center;font:16px/1.5 system-ui,sans-serif}#page-loading p{margin:8px}#page-loading button{font:inherit;padding:10px 18px}</style>
<script>
${deviceLayout}
(() => {
  ${alias ? `location.replace(new URL('../../../${alias}/', location.href)); return;` : ''}
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
mkdirSync(resolve(out, 'assets/nothing'), {recursive: true});
for (const asset of Object.values(nothingAssets)) writeFileSync(resolve(out, asset.path), asset.content);
mkdirSync(resolve(out, 'assets/room-design'), {recursive: true});
for (const asset of Object.values(roomAssets)) writeFileSync(resolve(out, asset.path), asset.content);
mkdirSync(resolve(out, 'assets/13-reasons-why'), {recursive: true});
for (const asset of Object.values(thirteenAssets)) writeFileSync(resolve(out, asset.path), asset.content);
mkdirSync(resolve(out, 'assets/still-life'), {recursive: true});
for (const asset of Object.values(stillLifeAssets)) writeFileSync(resolve(out, asset.path), asset.content);
mkdirSync(resolve(out, 'assets/apple-music'), {recursive: true});
for (const asset of Object.values(appleMusicAssets)) writeFileSync(resolve(out, asset.path), asset.content);
mkdirSync(resolve(out, 'assets/mome729'), {recursive: true});
for (const asset of Object.values(mome729Assets)) writeFileSync(resolve(out, asset.path), asset.content);
for (const asset of Object.values(amtrakAssets)) {
  mkdirSync(dirname(resolve(out, asset.path)), {recursive: true});
  writeFileSync(resolve(out, asset.path), asset.content);
}
for (const route of routes) {
  const desktop = readFileSync(resolve(root, 'pages', route, 'index.html'), 'utf8');
  const mobile = readFileSync(resolve(root, 'pages-mobile', route, 'index.html'), 'utf8');
  const directory = resolve(out, route);
  mkdirSync(directory, {recursive: true});
  const desktopDocument = adapt(desktop, false, route);
  const responsiveDocument = adapt(mobile, true, route);
  writeFileSync(resolve(directory, 'view-desktop.html'), desktopDocument);
  writeFileSync(resolve(directory, 'view-mobile.html'), responsiveDocument);
  writeFileSync(resolve(directory, 'index.html'), entry(desktopDocument, route, fingerprint(desktopDocument), fingerprint(responsiveDocument)));
}
mkdirSync(resolve(out, 'home'), {recursive: true});
for (const file of ['index.html', 'view-desktop.html', 'view-mobile.html']) cpSync(resolve(out, file), resolve(out, 'home', file));
writeFileSync(resolve(out, 'CNAME'), 'mingyuniverse.com\n');
writeFileSync(resolve(out, '.nojekyll'), '');
writeFileSync(resolve(out, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${siteOrigin}/sitemap.xml\n`);
const indexedRoutes = routes.filter(route => !['blank', 'fullscreen-page'].includes(route));
writeFileSync(resolve(out, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${indexedRoutes.map(route => `  <url><loc>${canonicalFor(route)}</loc></url>`).join('\n')}\n</urlset>\n`);
console.log(`Built ${routes.length} routes with desktop and phone layouts for GitHub Pages.`);
