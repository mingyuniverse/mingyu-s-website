// Page HTML is embedded by scripts/build.mjs. Layout, styles, content, and
// animation configuration are preserved from the public reference website.
const SOURCE = 'https://www.dumingyuyuyu.com';
const SNAPSHOTS = __SNAPSHOTS__;

function localize(text, origin) {
  return text.split(SOURCE).join(origin)
    .split(SOURCE.replaceAll('/', '\\/')).join(origin.replaceAll('/', '\\/'));
}

async function htmlForPage(path) {
  const compressed = SNAPSHOTS[path];
  if (!compressed) return null;
  const bytes = Uint8Array.from(atob(compressed), character => character.charCodeAt(0));
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
  return new Response(stream).text();
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const portfolioRead = request.method === 'POST' && url.pathname === '/_serverless/portfolio-router/pages';
    if (request.method !== 'GET' && request.method !== 'HEAD' && !portfolioRead) {
      return new Response('Method not allowed', {status: 405, headers: {Allow: 'GET, HEAD'}});
    }
    let path;
    try { path = decodeURIComponent(url.pathname).replace(/\/+$/, '') || '/'; }
    catch { return new Response('Invalid URL', {status: 400}); }
    if (path === '/home') path = '/';
    const html = await htmlForPage(path);
    if (html !== null) {
      return new Response(request.method === 'HEAD' ? null : localize(html, url.origin), {
        headers: {'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache'}
      });
    }
    // Only the public read endpoints used by the original animation and
    // gallery runtime are forwarded. Visitor cookies and credentials stay local.
    if (!url.pathname.startsWith('/_api/') && !url.pathname.startsWith('/_partials/') && !portfolioRead) {
      return new Response('Page not found', {status: 404});
    }
    try {
      const upstream = await fetch(SOURCE + url.pathname + url.search, {
        method: request.method,
        headers: {'User-Agent': 'Mozilla/5.0', Referer: SOURCE + '/', ...(portfolioRead ? {'Content-Type': request.headers.get('Content-Type') || 'application/json'} : {})},
        ...(portfolioRead ? {body: await request.text()} : {}),
        redirect: 'follow'
      });
      const contentType = upstream.headers.get('Content-Type') || 'application/octet-stream';
      const textResponse = /json|javascript|text\//i.test(contentType);
      const body = textResponse ? localize(await upstream.text(), url.origin) : upstream.body;
      return new Response(request.method === 'HEAD' ? null : body, {
        status: upstream.status,
        headers: {'Content-Type': contentType, 'Cache-Control': 'no-store'}
      });
    } catch {
      return new Response('The original media runtime is temporarily unavailable.', {status: 502});
    }
  }
};
