import {existsSync, readFileSync} from 'node:fs';
import {resolve} from 'node:path';

const root = resolve(import.meta.dirname, '..');
const manifestFile = resolve(root, 'assets/localized/manifest.json');
const manifest = existsSync(manifestFile) ? JSON.parse(readFileSync(manifestFile, 'utf8')) : {};
const scanning = process.env.LOCAL_ASSET_SCAN === '1';
const decode = value => value.replaceAll('&amp;', '&').replaceAll('&quot;', '"').replaceAll('&#39;', "'");

// Retain the captured markup and inline layout CSS, without executing the
// hosted editor, its API clients, telemetry, or custom-element hydration.
export function removeHostedRuntime(html) {
  return html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<link\b[^>]*>/gi, tag => /rel=["'](?:prefetch|preconnect|dns-prefetch|modulepreload|preload)["']/i.test(tag) ? '' : tag)
    .replace(/\s+on(?:click|load|error|keydown|keyup|mouseover|mouseout)="[^"]*"/gi, '')
    .replace(/\s+data-(?:url|href)="[^"]*"/gi, '');
}

export function independentDocument(html, route) {
  const prefix = '../'.repeat(route ? route.split('/').length : 0);
  const local = value => {
    const url = decode(value).replace(/^\/\//, 'https://');
    if (!/^https?:\/\//.test(url)) return value;
    if (manifest[url]) return prefix + manifest[url].path;
    if (!scanning && /(?:wixstatic\.com|parastorage\.com|fonts\.googleapis\.com|fonts\.gstatic\.com)/.test(url)) {
      throw new Error(`Unarchived resource on /${route}: ${url}`);
    }
    return value;
  };
  html = html.replace(/\b(src|poster|srcset|href|xlink:href)="([^"]*)"/gi, (whole, name, value) => {
    name = name.toLowerCase();
    if (name === 'srcset') return `${name}="${value.replace(/(?:https?:)?\/\/[^\s]+/g, local)}"`;
    if (name === 'href' && /^https?:\/\/(?:www\.)?dumingyuyuyu\.com(?:\/|$)/.test(value)) {
      const url = new URL(decode(value));
      return `href="${prefix || './'}${url.pathname.replace(/^\//, '')}${url.search}${url.hash}"`;
    }
    return `${name}="${local(value)}"`;
  });
  html = html.replace(/url\(\s*(['"]?)([^)'"\s]+)\1\s*\)/gi, (whole, quote, url) => `url(${quote}${local(url)}${quote})`);
  // Remove configuration attributes that are inert without the old runtime.
  html = html.replace(/\s+data-(?:image-info|video-info|svg-type|has-bg-scroll-effect)="[^"]*"/gi, '');
  const policy = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; media-src 'self' blob:; connect-src 'self'; frame-src 'none'; object-src 'none'; base-uri 'self'";
  return html.replace(/<head([^>]*)>/i, `$&<meta http-equiv="Content-Security-Policy" content="${policy}">`);
}
